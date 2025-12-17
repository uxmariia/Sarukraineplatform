import { useState, useEffect } from 'react';
import { Medal, Trophy, Calendar, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { Competition } from '../../types';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

type ExtendedParticipant = {
    id?: string;
    userId: string;
    dogId: string;
    userName: string;
    dogName: string;
    dogBreed?: string;
    dogBirth: string;
    status: string;
    results?: {
        search?: number;
        obedience?: number;
        total?: number;
        place?: number;
        qualification?: string;
        notes?: string;
    };
    category?: string;
    class?: string;
};

type CompetitionWithResults = Competition & {
    participants?: ExtendedParticipant[];
};

type ResultsPageProps = {
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
};

export default function ResultsPage({ showToast }: ResultsPageProps) {
    const [competitions, setCompetitions] = useState<CompetitionWithResults[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCompetition, setExpandedCompetition] = useState<string | null>(null);

    useEffect(() => {
        loadCompletedCompetitions();
    }, []);

    const loadCompletedCompetitions = async () => {
        try {
            console.log('Loading competitions...');
            const data = await apiRequest('/competitions');
            console.log('All competitions:', data);
            
            // Load participants for each competition (show all competitions, not just past ones)
            const competitionsWithParticipants = await Promise.all(
                data.map(async (comp: Competition) => {
                    try {
                        const details = await apiRequest(`/competitions/${comp.id}/results`);
                        console.log(`Participants for ${comp.name}:`, details.participants);
                        
                        // Log first participant to see structure
                        if (details.participants && details.participants.length > 0) {
                            console.log('First participant structure:', details.participants[0]);
                        }
                        
                        return { ...comp, participants: details.participants || [] };
                    } catch (e) {
                        console.error(`Failed to load participants for ${comp.id}:`, e);
                        return { ...comp, participants: [] };
                    }
                })
            );

            setCompetitions(competitionsWithParticipants);
        } catch (e) {
            console.error('Failed to load competitions:', e);
            showToast('Помилка завантаження результатів', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (competitionId: string) => {
        setExpandedCompetition(expandedCompetition === competitionId ? null : competitionId);
    };

    if (loading) {
        return (
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-[60px]">
                <div className="text-center text-slate-400">Завантаження...</div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-[60px]">
            <div className="mb-8 sm:mb-12 text-left">
                <h1 className="text-4xl sm:text-5xl md:text-[48px] mb-2 bg-gradient-to-br from-white to-indigo-300 bg-clip-text text-transparent">
                    Результати
                </h1>
                <p className="text-base sm:text-lg text-slate-400">Результати минулих змагань</p>
            </div>

            {competitions.length === 0 ? (
                <div className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border-2 border-dashed border-[rgba(99,102,241,0.3)] rounded-[20px] p-[60px_20px] sm:p-[100px_40px] text-center">
                    <Medal className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-5 opacity-50 text-slate-500" />
                    <p className="text-base sm:text-lg text-slate-500">Немає доступних результатів</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {competitions.map((competition) => {
                        const isExpanded = expandedCompetition === competition.id;
                        
                        // Get all confirmed participants
                        const confirmedParticipants = competition.participants?.filter(p => p.status === 'confirmed') || [];
                        
                        // Group participants by category and class
                        const groupsWithResults: Record<string, ExtendedParticipant[]> = {};
                        const groupsWithoutResults: Record<string, ExtendedParticipant[]> = {};
                        
                        confirmedParticipants.forEach(p => {
                            const key = p.class || 'Без класу';
                            
                            if (p.results?.place) {
                                // Has results with place
                                if (!groupsWithResults[key]) groupsWithResults[key] = [];
                                groupsWithResults[key].push(p);
                            } else {
                                // No results yet - just participants list
                                if (!groupsWithoutResults[key]) groupsWithoutResults[key] = [];
                                groupsWithoutResults[key].push(p);
                            }
                        });

                        // Sort participants by place within each group
                        Object.keys(groupsWithResults).forEach(groupName => {
                            groupsWithResults[groupName].sort((a, b) => (a.results?.place || 999) - (b.results?.place || 999));
                        });

                        const hasResults = Object.keys(groupsWithResults).length > 0;
                        const hasParticipants = Object.keys(groupsWithoutResults).length > 0;
                        const hasAnyData = hasResults || hasParticipants;

                        return (
                            <Card 
                                key={competition.id} 
                                className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border-[rgba(99,102,241,0.2)] overflow-hidden"
                            >
                                <CardHeader 
                                    className={`${hasAnyData ? 'cursor-pointer hover:bg-[rgba(99,102,241,0.05)] transition-colors' : ''}`}
                                    onClick={() => hasAnyData && toggleExpand(competition.id)}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex-1">
                                            <CardTitle className="text-xl sm:text-2xl text-white mb-2 flex items-start gap-2">
                                                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 flex-shrink-0 mt-1" />
                                                <span className="pt-[0px] pr-[0px] pb-[4px] pl-[0px]">{competition.name}</span>
                                            </CardTitle>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm sm:text-base text-slate-400 ml-7 sm:ml-8 pt-[0px] pr-[0px] pb-[8px] pl-[0px]">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(competition.date).toLocaleDateString('uk-UA')}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4" />
                                                    {competition.location}
                                                </div>
                                            </div>
                                        </div>
                                        {hasAnyData && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-indigo-400 hover:text-indigo-300 hover:bg-[rgba(99,102,241,0.1)] self-start sm:self-center"
                                            >
                                                {isExpanded ? (
                                                    <>
                                                        <ChevronUp className="w-4 h-4 mr-2" />
                                                        Згорнути
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown className="w-4 h-4 mr-2" />
                                                        {hasResults ? 'Переглянути результати' : 'Переглянути учасників'}
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        {!hasAnyData && (
                                            <Badge variant="outline" className="border-slate-600 text-slate-500 self-start sm:self-center">
                                                Немає учасників
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>

                                {isExpanded && hasAnyData && (
                                    <CardContent className="pt-0">
                                        <div className="space-y-8">
                                            {/* Groups WITH results (with places and scores) */}
                                            {Object.keys(groupsWithResults).map(groupName => {
                                                const groupParticipants = groupsWithResults[groupName];
                                                
                                                return (
                                                    <div key={groupName}>
                                                        <h3 className="text-lg sm:text-xl text-indigo-300 mb-4 pb-2 border-b border-indigo-500/20">
                                                            {groupName}
                                                        </h3>

                                                        {/* Mobile: Cards */}
                                                        <div className="md:hidden space-y-3">
                                                            {groupParticipants.map((p, idx) => (
                                                                <div 
                                                                    key={p.id || `${p.userId}-${p.dogId}-${idx}`}
                                                                    className="bg-[rgba(15,23,42,0.5)] border border-indigo-500/20 rounded-xl p-4"
                                                                >
                                                                    <div className="flex items-start gap-3 mb-3">
                                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                                            p.results?.place === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                                                                            p.results?.place === 2 ? 'bg-slate-300/20 text-slate-300' :
                                                                            p.results?.place === 3 ? 'bg-orange-700/20 text-orange-400' :
                                                                            'bg-slate-700/20 text-slate-500'
                                                                        }`}>
                                                                            {p.results?.place}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="text-white font-medium text-base truncate">{p.userName}</div>
                                                                            <div className="text-slate-400 text-sm truncate">{p.dogName}</div>
                                                                            {p.dogBreed && <div className="text-slate-500 text-xs">{p.dogBreed}</div>}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                                                        <div className="bg-[rgba(99,102,241,0.1)] rounded-lg p-2">
                                                                            <div className="text-slate-400 text-xs mb-1">Пошук</div>
                                                                            <div className="text-white">{p.results?.search?.toFixed(1) || '-'}</div>
                                                                        </div>
                                                                        <div className="bg-[rgba(99,102,241,0.1)] rounded-lg p-2">
                                                                            <div className="text-slate-400 text-xs mb-1">Послух</div>
                                                                            <div className="text-white">{p.results?.obedience?.toFixed(1) || '-'}</div>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="pt-3 border-t border-indigo-500/20 space-y-2">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-slate-400 text-sm">Загальний бал:</span>
                                                                            <span className="text-indigo-300 font-bold text-lg">{p.results?.total?.toFixed(1) || '-'}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-slate-400 text-sm">Оцінка:</span>
                                                                            <Badge variant="outline" className={`text-xs py-0.5 font-normal ${
                                                                                p.results?.qualification === 'Відмінно' ? 'border-green-500 text-green-400' :
                                                                                p.results?.qualification === 'Дуже добре' ? 'border-blue-500 text-blue-400' :
                                                                                p.results?.qualification === 'Добре' ? 'border-cyan-500 text-cyan-400' :
                                                                                p.results?.qualification === 'Задовільно' ? 'border-yellow-500 text-yellow-400' :
                                                                                p.results?.qualification === 'Неостатньо' ? 'border-red-500 text-red-400' :
                                                                                'border-slate-700 text-slate-500'
                                                                            }`}>
                                                                                {p.results?.qualification || '—'}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Desktop: Table */}
                                                        <div className="hidden md:block overflow-x-auto">
                                                            <table className="w-full border-collapse">
                                                                <thead>
                                                                    <tr className="bg-[rgba(99,102,241,0.15)]">
                                                                        <th className="p-3 text-left text-white">#</th>
                                                                        <th className="p-3 text-left text-white">Учасник</th>
                                                                        <th className="p-3 text-left text-white">Собака</th>
                                                                        <th className="p-3 text-center text-white">Пошук</th>
                                                                        <th className="p-3 text-center text-white">Послух</th>
                                                                        <th className="p-3 text-center text-white">Заг. бал</th>
                                                                        <th className="p-3 text-left text-white">Оцінка</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {groupParticipants.map((p, idx) => (
                                                                        <tr 
                                                                            key={p.id || `${p.userId}-${p.dogId}-${idx}`}
                                                                            className="border-t border-[rgba(99,102,241,0.1)] hover:bg-[rgba(99,102,241,0.05)]"
                                                                        >
                                                                            <td className="p-3">
                                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                                                    p.results?.place === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                                                                                    p.results?.place === 2 ? 'bg-slate-300/20 text-slate-300' :
                                                                                    p.results?.place === 3 ? 'bg-orange-700/20 text-orange-400' :
                                                                                    'text-slate-500'
                                                                                }`}>
                                                                                    {p.results?.place}
                                                                                </div>
                                                                            </td>
                                                                            <td className="p-3 text-slate-300">{p.userName}</td>
                                                                            <td className="p-3">
                                                                                <div className="text-slate-300">{p.dogName}</div>
                                                                                {p.dogBreed && <div className="text-sm text-slate-500">{p.dogBreed}</div>}
                                                                            </td>
                                                                            <td className="p-3 text-center text-slate-400">{p.results?.search?.toFixed(1) || '-'}</td>
                                                                            <td className="p-3 text-center text-slate-400">{p.results?.obedience?.toFixed(1) || '-'}</td>
                                                                            <td className="p-3 text-center text-indigo-300 font-bold">{p.results?.total?.toFixed(1) || '-'}</td>
                                                                            <td className="p-3">
                                                                                <Badge variant="outline" className={`text-sm py-1 font-normal ${
                                                                                    p.results?.qualification === 'Відмінно' ? 'border-green-500 text-green-400' :
                                                                                    p.results?.qualification === 'Дуже добре' ? 'border-blue-500 text-blue-400' :
                                                                                    p.results?.qualification === 'Добре' ? 'border-cyan-500 text-cyan-400' :
                                                                                    p.results?.qualification === 'Задовільно' ? 'border-yellow-500 text-yellow-400' :
                                                                                    p.results?.qualification === 'Недостатньо' ? 'border-red-500 text-red-400' :
                                                                                    'border-slate-700 text-slate-500'
                                                                                }`}>
                                                                                    {p.results?.qualification || '—'}
                                                                                </Badge>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Groups WITHOUT results (just participants list) */}
                                            {Object.keys(groupsWithoutResults).map(groupName => {
                                                const groupParticipants = groupsWithoutResults[groupName];
                                                
                                                return (
                                                    <div key={groupName}>
                                                        <h3 className="text-lg sm:text-xl text-indigo-300 mb-4 pb-2 border-b border-indigo-500/20">
                                                            {groupName}
                                                        </h3>

                                                        {/* Mobile: Cards */}
                                                        <div className="md:hidden space-y-3">
                                                            {groupParticipants.map((p, idx) => (
                                                                <div 
                                                                    key={p.id || `${p.userId}-${p.dogId}-${idx}`}
                                                                    className="bg-[rgba(15,23,42,0.5)] border border-indigo-500/20 rounded-xl p-4"
                                                                >
                                                                    <div className="flex items-start gap-3 mb-3">
                                                                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-700/20 text-slate-500">
                                                                            {p.results?.place}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="text-white font-medium text-base truncate">{p.userName}</div>
                                                                            <div className="text-slate-400 text-sm truncate">{p.dogName}</div>
                                                                            {p.dogBreed && <div className="text-slate-500 text-xs">{p.dogBreed}</div>}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                                                        <div className="bg-[rgba(99,102,241,0.1)] rounded-lg p-2">
                                                                            <div className="text-slate-400 text-xs mb-1">Пошук</div>
                                                                            <div className="text-white">{p.results?.search?.toFixed(1) || '-'}</div>
                                                                        </div>
                                                                        <div className="bg-[rgba(99,102,241,0.1)] rounded-lg p-2">
                                                                            <div className="text-slate-400 text-xs mb-1">Послух</div>
                                                                            <div className="text-white">{p.results?.obedience?.toFixed(1) || '-'}</div>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="pt-3 border-t border-indigo-500/20 space-y-2">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-slate-400 text-sm">Загальний бал:</span>
                                                                            <span className="text-indigo-300 font-bold text-lg">{p.results?.total?.toFixed(1) || '-'}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-slate-400 text-sm">Оцінка:</span>
                                                                            <Badge variant="outline" className={`text-xs py-0.5 font-normal ${
                                                                                p.results?.qualification === 'Відмінно' ? 'border-green-500 text-green-400' :
                                                                                p.results?.qualification === 'Дуже добре' ? 'border-blue-500 text-blue-400' :
                                                                                p.results?.qualification === 'Добре' ? 'border-cyan-500 text-cyan-400' :
                                                                                p.results?.qualification === 'Задовільно' ? 'border-yellow-500 text-yellow-400' :
                                                                                p.results?.qualification === 'Неостатньо' ? 'border-red-500 text-red-400' :
                                                                                'border-slate-700 text-slate-500'
                                                                            }`}>
                                                                                {p.results?.qualification || '—'}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Desktop: Table */}
                                                        <div className="hidden md:block overflow-x-auto">
                                                            <table className="w-full border-collapse">
                                                                <thead>
                                                                    <tr className="bg-[rgba(99,102,241,0.15)]">
                                                                        <th className="p-3 text-left text-white">#</th>
                                                                        <th className="p-3 text-left text-white">Учасник</th>
                                                                        <th className="p-3 text-left text-white">Собака</th>
                                                                        <th className="p-3 text-center text-white">Пошук</th>
                                                                        <th className="p-3 text-center text-white">Послух</th>
                                                                        <th className="p-3 text-center text-white">Заг. бал</th>
                                                                        <th className="p-3 text-left text-white">Оцінка</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {groupParticipants.map((p, idx) => (
                                                                        <tr 
                                                                            key={p.id || `${p.userId}-${p.dogId}-${idx}`}
                                                                            className="border-t border-[rgba(99,102,241,0.1)] hover:bg-[rgba(99,102,241,0.05)]"
                                                                        >
                                                                            <td className="p-3">
                                                                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-700/20 text-slate-500">
                                                                                    {p.results?.place}
                                                                                </div>
                                                                            </td>
                                                                            <td className="p-3 text-slate-300">{p.userName}</td>
                                                                            <td className="p-3">
                                                                                <div className="text-slate-300">{p.dogName}</div>
                                                                                {p.dogBreed && <div className="text-sm text-slate-500">{p.dogBreed}</div>}
                                                                            </td>
                                                                            <td className="p-3 text-center text-slate-400">{p.results?.search?.toFixed(1) || '-'}</td>
                                                                            <td className="p-3 text-center text-slate-400">{p.results?.obedience?.toFixed(1) || '-'}</td>
                                                                            <td className="p-3 text-center text-indigo-300 font-bold">{p.results?.total?.toFixed(1) || '-'}</td>
                                                                            <td className="p-3">
                                                                                <Badge variant="outline" className={`text-sm py-1 font-normal ${
                                                                                    p.results?.qualification === 'Відмінно' ? 'border-green-500 text-green-400' :
                                                                                    p.results?.qualification === 'Дуже добре' ? 'border-blue-500 text-blue-400' :
                                                                                    p.results?.qualification === 'Добре' ? 'border-cyan-500 text-cyan-400' :
                                                                                    p.results?.qualification === 'Задовільно' ? 'border-yellow-500 text-yellow-400' :
                                                                                    p.results?.qualification === 'Недостатньо' ? 'border-red-500 text-red-400' :
                                                                                    'border-slate-700 text-slate-500'
                                                                                }`}>
                                                                                    {p.results?.qualification || '—'}
                                                                                </Badge>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}