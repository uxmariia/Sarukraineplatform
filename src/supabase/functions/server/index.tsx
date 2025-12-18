import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();
const BASE_PATH = "/make-server-5f926218";

// Create global Supabase clients
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const supabaseAuth = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!
);

// Middleware
app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// Helpers
const getUser = async (c: any) => {
  const authHeader = c.req.header('Authorization');
  console.log('getUser: Authorization header:', authHeader ? `Bearer ${authHeader.split(' ')[1]?.substring(0, 15)}...` : 'MISSING');
  
  if (!authHeader) {
    console.log('getUser: No Authorization header provided');
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('getUser: No token in Authorization header');
    return null;
  }

  // If token looks like anon key, do not try to get user, just return null
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!token || token.length < 20 || token === anonKey) {
      console.log('getUser: Token is anon key or invalid length', { 
        isAnonKey: token === anonKey,
        tokenLength: token?.length 
      });
      return null;
  }

  try {
    console.log('getUser: Attempting to verify user token...', {
      tokenLength: token.length,
      tokenStart: token.substring(0, 20),
      tokenEnd: token.substring(token.length - 10)
    });
    
    // Use supabaseAdmin with SERVICE_ROLE_KEY to verify any user token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
        // Suppress AuthSessionMissingError from logs
        if (error.name !== 'AuthSessionMissingError') {
             console.error("getUser: Auth Error:", { 
               errorName: error.name, 
               message: error.message, 
               status: error.status,
               tokenPrefix: token.substring(0, 10) + '...' 
             });
        } else {
             console.log('getUser: AuthSessionMissingError - token might be expired or invalid');
        }
        return null;
    }
    
    if (!user) {
        console.log('getUser: No user returned from auth.getUser');
        return null;
    }
    
    console.log('getUser: ✅ Successfully authenticated user:', user.id, user.email);
    return user;
  } catch (e) {
      console.error("getUser: Exception:", e);
      return null;
  }
};

const getProfile = async (userId: string) => {
  const profile = await kv.get(`profile:${userId}`);
  return profile || { id: userId, role: 'user' }; 
};

const logAudit = async (userId: string, action: string, context: string, status: 'SUCCESS' | 'ERROR' = 'SUCCESS') => {
  const log = {
    id: crypto.randomUUID(),
    userId,
    action,
    context,
    status,
    timestamp: new Date().toISOString()
  };
  let logs = (await kv.get('audit_logs')) || [];
  if (!Array.isArray(logs)) logs = [];
  logs.unshift(log); 
  if (logs.length > 2000) logs = logs.slice(0, 2000);
  await kv.set('audit_logs', logs);
};

// Routes

// Health
app.get(`${BASE_PATH}/health`, (c) => c.json({ status: "ok" }));

// --- PROFILE ---
app.get(`${BASE_PATH}/profile/registrations`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const comps = (await kv.get('competitions')) || [];
  const registrations = [];
  const userDogs = (await kv.get(`dogs:${user.id}`)) || [];

  for (const comp of comps) {
      if (!comp.participants) continue;
      const participant = comp.participants.find((p:any) => p.userId === user.id);
      if (participant) {
           const dog = userDogs.find((d:any) => d.id === participant.dogId);
           registrations.push({
               competitionId: comp.id,
               competitionName: comp.name,
               startDate: comp.startDate || comp.date,
               endDate: comp.endDate,
               location: comp.location,
               dogName: dog?.name || 'Unknown',
               category: participant.category,
               class: participant.class,
               status: participant.status,
               documents: participant.documents,
               notes: participant.results?.notes
           });
      }
  }
  return c.json(registrations);
});

app.get(`${BASE_PATH}/profile`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  
  let profile = await kv.get(`profile:${user.id}`);
  if (!profile) {
    profile = { 
      id: user.id, 
      role: 'user', 
      email: user.email, 
      name: user.user_metadata?.name || '',
      joinedAt: new Date().toISOString() 
    };
    await kv.set(`profile:${user.id}`, profile);
    
    // Add to global users list for Admin
    let allUsers = (await kv.get('users_list')) || [];
    if (!Array.isArray(allUsers)) allUsers = [];
    if (!allUsers.find((u:any) => u.id === user.id)) {
        allUsers.push({ id: user.id, email: user.email, name: profile.name });
        await kv.set('users_list', allUsers);
    }
  }

  // Backdoor/Bootstrap for specific admin
  if ((user.email === 'kkek5039@gmail.com' || user.email === 'kkek5039gmail.com') && profile.role !== 'admin') {
      profile.role = 'admin';
      await kv.set(`profile:${user.id}`, profile);
  }

  return c.json(profile);
});

app.post(`${BASE_PATH}/profile`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const data = await c.req.json();
  const currentProfile = await getProfile(user.id);
  
  // Protect role
  const newProfile = { ...currentProfile, ...data, role: currentProfile.role, id: user.id };
  await kv.set(`profile:${user.id}`, newProfile);
  
  // Update in global list name
  let allUsers = (await kv.get('users_list')) || [];
  const uIndex = allUsers.findIndex((u:any) => u.id === user.id);
  if (uIndex >= 0) {
      allUsers[uIndex].name = newProfile.name || allUsers[uIndex].name;
      await kv.set('users_list', allUsers);
  }

  await logAudit(user.id, 'UPDATE_PROFILE', user.id);
  return c.json(newProfile);
});

// --- DOGS ---
app.get(`${BASE_PATH}/dogs`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const dogs = (await kv.get(`dogs:${user.id}`)) || [];
  return c.json(dogs);
});

app.post(`${BASE_PATH}/dogs`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const dogData = await c.req.json();
  const newDog = { ...dogData, id: crypto.randomUUID(), userId: user.id };
  
  let dogs = (await kv.get(`dogs:${user.id}`)) || [];
  if (!Array.isArray(dogs)) dogs = [];
  dogs.push(newDog);
  
  await kv.set(`dogs:${user.id}`, dogs);
  await logAudit(user.id, 'CREATE_DOG', newDog.id);
  return c.json(newDog);
});

app.put(`${BASE_PATH}/dogs/:id`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const updates = await c.req.json();
  
  let dogs = (await kv.get(`dogs:${user.id}`)) || [];
  const index = dogs.findIndex((d: any) => d.id === id);
  if (index === -1) return c.json({ error: 'Dog not found' }, 404);
  
  dogs[index] = { ...dogs[index], ...updates };
  await kv.set(`dogs:${user.id}`, dogs);
  await logAudit(user.id, 'UPDATE_DOG', id);
  return c.json(dogs[index]);
});

app.delete(`${BASE_PATH}/dogs/:id`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  
  let dogs = (await kv.get(`dogs:${user.id}`)) || [];
  const newDogs = dogs.filter((d: any) => d.id !== id);
  await kv.set(`dogs:${user.id}`, newDogs);
  await logAudit(user.id, 'DELETE_DOG', id);
  return c.json({ success: true });
});

// --- COMPETITIONS (Organizer/Admin writes, All read) ---
app.get(`${BASE_PATH}/competitions`, async (c) => {
  const comps = (await kv.get('competitions')) || [];
  return c.json(comps);
});

app.post(`${BASE_PATH}/competitions`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const profile = await getProfile(user.id);
  if (profile.role !== 'organizer' && profile.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }
  
  const data = await c.req.json();
  const newComp = { ...data, id: crypto.randomUUID(), organizerId: user.id, participants: [] };
  
  let comps = (await kv.get('competitions')) || [];
  if (!Array.isArray(comps)) comps = [];
  comps.push(newComp);
  
  await kv.set('competitions', comps);
  await logAudit(user.id, 'CREATE_COMPETITION', newComp.id);
  return c.json(newComp);
});

app.put(`${BASE_PATH}/competitions/:id`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const profile = await getProfile(user.id);
  const id = c.req.param('id');
  const updates = await c.req.json();

  let comps = (await kv.get('competitions')) || [];
  const index = comps.findIndex((c: any) => c.id === id);
  if (index === -1) return c.json({ error: 'Competition not found' }, 404);

  // Check ownership or admin
  if (comps[index].organizerId !== user.id && profile.role !== 'admin') {
      return c.json({ error: 'Forbidden' }, 403);
  }

  // Preserve participants array when updating competition
  const { participants, ...safeUpdates } = updates;
  comps[index] = { ...comps[index], ...safeUpdates };
  await kv.set('competitions', comps);
  await logAudit(user.id, 'UPDATE_COMPETITION', id);
  return c.json(comps[index]);
});

app.delete(`${BASE_PATH}/competitions/:id`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const profile = await getProfile(user.id);
  const id = c.req.param('id');

  let comps = (await kv.get('competitions')) || [];
  const comp = comps.find((c: any) => c.id === id);
  if (!comp) return c.json({ error: 'Competition not found' }, 404);

  if (comp.organizerId !== user.id && profile.role !== 'admin') {
      return c.json({ error: 'Forbidden' }, 403);
  }

  const newComps = comps.filter((c: any) => c.id !== id);
  await kv.set('competitions', newComps);
  await logAudit(user.id, 'DELETE_COMPETITION', id);
  return c.json({ success: true });
});

app.put(`${BASE_PATH}/competitions/:id/participants`, async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await getProfile(user.id);
    const compId = c.req.param('id');
    const { userId, dogId, category, participantId, status, results } = await c.req.json();

    let comps = (await kv.get('competitions')) || [];
    const index = comps.findIndex((c:any) => c.id === compId);
    if (index === -1) return c.json({error: 'Competition not found'}, 404);

    if (comps[index].organizerId !== user.id && profile.role !== 'admin') {
        return c.json({ error: 'Forbidden' }, 403);
    }

    const comp = comps[index];
    if (!comp.participants) comp.participants = [];
    
    let pIndex = -1;
    if (participantId) {
        pIndex = comp.participants.findIndex((p:any) => p.id === participantId);
    } else {
        // Fallback logic - search by class field
        if (category) {
             // Try to match by class field
             pIndex = comp.participants.findIndex((p:any) => p.userId === userId && p.dogId === dogId && p.class === category);
        }
        
        if (pIndex === -1) {
             // Fallback to old behavior (first match by dog+user)
             pIndex = comp.participants.findIndex((p:any) => p.userId === userId && p.dogId === dogId);
        }
    }

    if (pIndex === -1) return c.json({error: 'Participant not found'}, 404);

    // Update participant data
    if (status) comp.participants[pIndex].status = status;
    if (results) comp.participants[pIndex].results = results;
    // IMPORTANT: Update class field from category to maintain consistency
    if (category) comp.participants[pIndex].class = category;

    comps[index] = comp;
    await kv.set('competitions', comps);
    await logAudit(user.id, 'UPDATE_PARTICIPANT', `${compId}:${userId}`);
    return c.json(comp.participants[pIndex]);
});

app.post(`${BASE_PATH}/competitions/:id/register`, async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const compId = c.req.param('id');
    const { dogId, category, handlerName, documents } = await c.req.json();

    let comps = (await kv.get('competitions')) || [];
    const index = comps.findIndex((c:any) => c.id === compId);
    if (index === -1) return c.json({error: 'Competition not found'}, 404);

    const comp = comps[index];
    
    // Check if registration is open
    if (comp.status !== 'registration_open') {
        return c.json({error: 'Реєстрація на ці змагання закрита'}, 400);
    }

    if (!comp.participants) comp.participants = [];
    
    // Check for existing registration for this dog in this class (category field contains class value)
    const existing = comp.participants.find((p:any) => 
        p.userId === user.id && 
        p.dogId === dogId && 
        p.class === category && // Using class field for storage
        p.status !== 'rejected'
    );
    
    if (existing) {
        return c.json({error: 'This dog is already registered in this category'}, 400);
    }

    comp.participants.push({ 
        id: crypto.randomUUID(),
        userId: user.id, 
        dogId, 
        class: category, // Store in 'class' field (value comes from 'category' in request)
        handlerName: handlerName || undefined,
        documents,
        status: 'registered', 
        date: new Date().toISOString() 
    });
    
    comps[index] = comp;
    await kv.set('competitions', comps);
    await logAudit(user.id, 'REGISTER_COMPETITION', compId);
    return c.json({success: true});
});

app.get(`${BASE_PATH}/competitions/:id/details`, async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    // Check permissions
    const profile = await getProfile(user.id);
    const compId = c.req.param('id');
    
    const comps = (await kv.get('competitions')) || [];
    const comp = comps.find((c: any) => c.id === compId);
    
    if (!comp) return c.json({ error: 'Competition not found' }, 404);
    
    if (comp.organizerId !== user.id && profile.role !== 'admin') {
         return c.json({ error: 'Forbidden' }, 403);
    }

    // Hydrate participants
    const participants = comp.participants || [];
    const hydratedParticipants = await Promise.all(participants.map(async (p: any) => {
        // Fetch User Name (Owner)
        const participantProfile = await getProfile(p.userId);
        
        // Fetch Dog Details
        const userDogs = (await kv.get(`dogs:${p.userId}`)) || [];
        const dog = userDogs.find((d: any) => d.id === p.dogId);
        
        // Handler is stored as a name string, not an ID
        const handlerName = p.handlerName || participantProfile.name || 'Unknown';
        
        return {
            ...p,
            // Map 'class' field to 'category' for frontend compatibility
            category: p.class,
            userName: participantProfile.name || 'Unknown',
            handlerName: handlerName,
            dogName: dog?.name || 'Unknown',
            dogBirth: dog?.birth || null,
            dogBreed: dog?.breed || '',
            dogPedigree: dog?.pedigree || '',
            dogChip: dog?.chip || '',
            dogWorkbook: dog?.workbook || ''
        };
    }));

    return c.json({
        ...comp,
        participants: hydratedParticipants
    });
});

// Public endpoint for viewing competition results
app.get(`${BASE_PATH}/competitions/:id/results`, async (c) => {
    try {
        const compId = c.req.param('id');
        
        const comps = (await kv.get('competitions')) || [];
        const comp = comps.find((c: any) => c.id === compId);
        
        if (!comp) return c.json({ error: 'Competition not found' }, 404);

        // Hydrate participants (public view - only confirmed participants)
        const participants = (comp.participants || []).filter((p: any) => p.status === 'confirmed');
        const hydratedParticipants = await Promise.all(participants.map(async (p: any) => {
            try {
                // Fetch User Name
                const participantProfile = await getProfile(p.userId);
                
                // Fetch Dog Name and Birth
                const userDogs = (await kv.get(`dogs:${p.userId}`)) || [];
                const dog = userDogs.find((d: any) => d.id === p.dogId);
                
                // Log participant data to debug
                console.log('Participant data:', {
                    userId: p.userId,
                    dogId: p.dogId,
                    class: p.class,
                    category: p.category,
                    status: p.status
                });
                
                return {
                    ...p, // This includes id, userId, dogId, status, results, class, category, etc.
                    userName: participantProfile?.name || 'Unknown',
                    dogName: dog?.name || 'Unknown',
                    dogBirth: dog?.birth || null,
                    dogBreed: dog?.pedigree || ''
                };
            } catch (err) {
                console.error(`Error hydrating participant ${p.userId}:`, err);
                return {
                    ...p,
                    userName: 'Unknown',
                    dogName: 'Unknown',
                    dogBirth: null,
                    dogBreed: ''
                };
            }
        }));

        return c.json({
            id: comp.id,
            name: comp.name,
            date: comp.date,
            location: comp.location,
            participants: hydratedParticipants
        });
    } catch (error) {
        console.error('Error in /competitions/:id/results:', error);
        return c.json({ error: 'Internal server error', details: String(error) }, 500);
    }
});

// --- ADMIN / GENERIC RESOURCES (Judges, Teams, Documents) ---
const createResourceHandler = (key: string) => {
    return {
        get: async (c: any) => {
             const data = (await kv.get(key)) || [];
             return c.json(data);
        },
        post: async (c: any) => {
            const user = await getUser(c);
            if (!user) return c.json({ error: 'Unauthorized' }, 401);
            const profile = await getProfile(user.id);
            if (profile.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);

            const item = await c.req.json();
            const newItem = { ...item, id: crypto.randomUUID() };
            let list = (await kv.get(key)) || [];
            if (!Array.isArray(list)) list = [];
            list.push(newItem);
            await kv.set(key, list);
            await logAudit(user.id, `CREATE_${key.toUpperCase()}`, newItem.id);
            return c.json(newItem);
        },
        put: async (c: any) => {
            const user = await getUser(c);
            if (!user) return c.json({ error: 'Unauthorized' }, 401);
            const profile = await getProfile(user.id);
            if (!profile || profile.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);
            
            const id = c.req.param('id');
            const updates = await c.req.json();
            let list = (await kv.get(key)) || [];
            const index = list.findIndex((i:any) => i.id === id);
            if (index === -1) return c.json({ error: 'Not found' }, 404);
            
            list[index] = { ...list[index], ...updates, id };
            await kv.set(key, list);
            await logAudit(user.id, `UPDATE_${key.toUpperCase()}`, id);
            return c.json(list[index]);
        },
        delete: async (c: any) => {
            const user = await getUser(c);
            if (!user) return c.json({ error: 'Unauthorized' }, 401);
            const profile = await getProfile(user.id);
            if (profile.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);
            
            const id = c.req.param('id');
            let list = (await kv.get(key)) || [];
            list = list.filter((i:any) => i.id !== id);
            await kv.set(key, list);
            await logAudit(user.id, `DELETE_${key.toUpperCase()}`, id);
            return c.json({success: true});
        }
    }
}

const judgesHandler = createResourceHandler('judges');
app.get(`${BASE_PATH}/judges`, judgesHandler.get);
app.post(`${BASE_PATH}/judges`, judgesHandler.post);
app.put(`${BASE_PATH}/judges/:id`, judgesHandler.put);
app.delete(`${BASE_PATH}/judges/:id`, judgesHandler.delete);

const teamsHandler = createResourceHandler('teams');
app.get(`${BASE_PATH}/teams`, teamsHandler.get);
app.post(`${BASE_PATH}/teams`, teamsHandler.post);
app.put(`${BASE_PATH}/teams/:id`, teamsHandler.put);
app.delete(`${BASE_PATH}/teams/:id`, teamsHandler.delete);

const documentsHandler = createResourceHandler('documents');
app.get(`${BASE_PATH}/documents`, documentsHandler.get);
app.post(`${BASE_PATH}/documents`, documentsHandler.post);
app.put(`${BASE_PATH}/documents/:id`, documentsHandler.put);
app.delete(`${BASE_PATH}/documents/:id`, documentsHandler.delete);

// Upload document file
app.post(`${BASE_PATH}/documents/upload`, async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await getProfile(user.id);
    if (profile.role !== 'admin') return c.json({ error: 'Forbidden - Admin only' }, 403);

    try {
        const body = await c.req.parseBody();
        const file = body['file'];

        if (file instanceof File) {
             const fileName = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
             const arrayBuffer = await file.arrayBuffer();
             
             // Ensure bucket exists
             const bucketName = 'make-5f926218-documents';
             const { data: buckets } = await supabaseAdmin.storage.listBuckets();
             if (!buckets?.some(b => b.name === bucketName)) {
                 await supabaseAdmin.storage.createBucket(bucketName, { public: false });
             }

             const { data, error } = await supabaseAdmin.storage.from(bucketName).upload(fileName, arrayBuffer, {
                 contentType: file.type
             });

             if (error) {
                 console.error('Document upload error:', error);
                 return c.json({ error: error.message }, 500);
             }

             return c.json({ path: data.path, fileName: file.name, fileType: file.type });
        }
        return c.json({ error: 'No file uploaded' }, 400);
    } catch (e) {
        console.error('Document upload exception:', e);
        return c.json({ error: 'Upload failed' }, 500);
    }
});

// Get signed URL for document download
app.get(`${BASE_PATH}/documents/:id/download`, async (c) => {
    try {
        const id = c.req.param('id');
        const documents = (await kv.get('documents')) || [];
        const doc = documents.find((d: any) => d.id === id);
        
        if (!doc || !doc.filePath) {
            console.error('Document not found or missing filePath:', { id, doc });
            return c.json({ error: 'Document not found' }, 404);
        }

        const { data: signedData, error } = await supabaseAdmin.storage
            .from('make-5f926218-documents')
            .createSignedUrl(doc.filePath, 3600); // 1 hour validity

        if (error) {
            console.error('Error creating signed URL:', error);
            return c.json({ error: 'Failed to generate download URL' }, 500);
        }

        return c.json({ url: signedData.signedUrl });
    } catch (e) {
        console.error('Download URL generation exception:', e);
        return c.json({ error: 'Failed to generate download URL' }, 500);
    }
});

// --- ADMIN SPECIFIC ---
app.post(`${BASE_PATH}/signup`, async (c) => {
    try {
        const { email, password, name } = await c.req.json();
        
        console.log('[Signup] Creating user:', email);
        
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            user_metadata: { name },
            // Automatically confirm the user's email since an email server hasn't been configured.
            email_confirm: true
        });

        if (error) {
            console.error('[Signup] Error creating user:', error);
            return c.json({ error: error.message }, 400);
        }

        console.log('[Signup] ✓ User created successfully:', data.user?.id);
        
        return c.json({ 
            success: true, 
            user: { 
                id: data.user?.id, 
                email: data.user?.email 
            } 
        });
    } catch (e) {
        console.error('[Signup] Exception:', e);
        return c.json({ error: 'Signup failed' }, 500);
    }
});

app.get(`${BASE_PATH}/admin/users`, async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await getProfile(user.id);
    if (profile.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);

    const users = (await kv.get('users_list')) || [];
    const fullUsers = await Promise.all(users.map(async (u:any) => {
        const p = await kv.get(`profile:${u.id}`);
        return { ...u, role: p?.role || 'user' };
    }));
    return c.json(fullUsers);
});

app.put(`${BASE_PATH}/admin/users/:id/role`, async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await getProfile(user.id);
    if (profile.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);
    
    const targetId = c.req.param('id');
    const { role } = await c.req.json();
    
    const targetProfile = await getProfile(targetId);
    targetProfile.role = role;
    await kv.set(`profile:${targetId}`, targetProfile);
    
    await logAudit(user.id, 'CHANGE_ROLE', `${targetId} -> ${role}`);
    return c.json(targetProfile);
});

app.get(`${BASE_PATH}/admin/audit`, async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await getProfile(user.id);
    if (profile.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);
    
    const logs = (await kv.get('audit_logs')) || [];
    return c.json(logs);
});

// --- RATING DEBUG ENDPOINT ---
app.get(`${BASE_PATH}/rating/debug`, async (c) => {
    try {
        const allCompetitions = (await kv.get('competitions')) || [];
        const debugInfo = {
            totalCompetitions: allCompetitions.length,
            competitions: allCompetitions.map((comp: any) => ({
                name: comp.name,
                status: comp.status,
                level: comp.level,
                participantsCount: comp.participants?.length || 0,
                participants: comp.participants?.map((p: any) => ({
                    userId: p.userId,
                    dogId: p.dogId,
                    class: p.class,
                    category: p.category,
                    status: p.status,
                    hasResults: !!p.results,
                    total: p.results?.total
                }))
            }))
        };
        return c.json(debugInfo);
    } catch (e) {
        console.error('[Rating Debug] Error:', e);
        return c.json({ error: 'Debug failed' }, 500);
    }
});

// --- RATING ENDPOINT ---
app.get(`${BASE_PATH}/rating`, async (c) => {
    try {
        const discipline = c.req.query('discipline') || 'rh-fl-b';
        
        // Get all competitions
        const allCompetitions = (await kv.get('competitions')) || [];
        console.log(`[Rating] Total competitions in database: ${allCompetitions.length}`);
        
        // Log all competitions for debugging
        allCompetitions.forEach((comp: any) => {
            console.log(`[Rating] Competition: ${comp.name}, Status: ${comp.status}, Level: ${comp.level}, Participants: ${comp.participants?.length || 0}`);
        });
        
        // Filter for completed competitions with level "Відбіркові" or "Відбіркові CACT"
        const qualifyingCompetitions = allCompetitions.filter((comp: any) => 
            comp.status === 'completed' && 
            (comp.level === 'Відбіркові' || comp.level === 'Відбіркові CACT')
        );
        
        console.log(`[Rating] Found ${qualifyingCompetitions.length} qualifying competitions for ${discipline}`);
        
        // Collect all results grouped by participant (userId + dogId)
        const participantResults: Map<string, {
            userId: string;
            dogId: string;
            userName: string;
            dogName: string;
            team: string;
            scores: number[];
        }> = new Map();
        
        for (const comp of qualifyingCompetitions) {
            if (!comp.participants) continue;
            
            console.log(`[Rating] Processing competition: ${comp.name}, Participants: ${comp.participants.length}`);
            
            for (const participant of comp.participants) {
                console.log(`[Rating] Participant: userId=${participant.userId}, dogId=${participant.dogId}, category=${participant.category}, class=${participant.class}, status=${participant.status}, total=${participant.results?.total}`);
                
                // Filter by discipline - check 'class' field which is the source of truth
                // Normalize for comparison: lowercase
                // NOTE: We do NOT replace V with B because RH-FL-V is a different class than RH-FL-B
                const participantClass = (participant.class || '').toLowerCase();
                const targetDiscipline = discipline.toLowerCase();
                
                if (participantClass !== targetDiscipline) {
                    console.log(`[Rating] Skipping - discipline mismatch (looking for ${targetDiscipline}, got class=${participant.class} normalized to ${participantClass})`);
                    continue;
                }
                
                // Only confirmed participants with results
                if (participant.status !== 'confirmed' || !participant.results?.total) {
                    console.log(`[Rating] Skipping - status=${participant.status}, has total=${!!participant.results?.total}`);
                    continue;
                }
                
                const key = `${participant.userId}:${participant.dogId}`;
                
                if (!participantResults.has(key)) {
                    // Fetch user profile and dog data for this participant
                    const participantProfile = await getProfile(participant.userId);
                    const userDogs = (await kv.get(`dogs:${participant.userId}`)) || [];
                    const dog = userDogs.find((d: any) => d.id === participant.dogId);
                    
                    participantResults.set(key, {
                        userId: participant.userId,
                        dogId: participant.dogId,
                        userName: participantProfile.name || 'Невідомий учасник',
                        dogName: dog?.name || 'Невідома собака',
                        team: participantProfile.team || 'Без команди',
                        scores: []
                    });
                }
                
                console.log(`[Rating] Adding score ${participant.results.total} for participant ${key}`);
                participantResults.get(key)!.scores.push(participant.results.total);
            }
        }
        
        // Calculate rating: sum of top 2 scores for each participant
        const ratingList = Array.from(participantResults.values()).map(participant => {
            // Sort scores descending and take top 2
            const topScores = [...participant.scores].sort((a, b) => b - a).slice(0, 2);
            const totalScore = topScores.reduce((sum, score) => sum + score, 0);
            
            return {
                userId: participant.userId,
                dogId: participant.dogId,
                athlete: participant.userName,
                dog: participant.dogName,
                team: participant.team,
                score: totalScore,
                competitions: participant.scores.length
            };
        });
        
        // Sort by score descending
        ratingList.sort((a, b) => b.score - a.score);
        
        // Add places
        const ratingWithPlaces = ratingList.map((item, index) => ({
            ...item,
            place: index + 1
        }));
        
        console.log(`[Rating] Generated rating with ${ratingWithPlaces.length} participants for ${discipline}`);
        
        return c.json(ratingWithPlaces);
    } catch (e) {
        console.error('[Rating] Error generating rating:', e);
        return c.json({ error: 'Failed to generate rating' }, 500);
    }
});

Deno.serve(app.fetch);