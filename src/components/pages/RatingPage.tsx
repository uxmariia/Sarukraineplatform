import { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import { apiRequest } from '../../utils/api';

type DisciplineType = 'rh-fl-b' | 'rh-t-b' | 'rh-f-b';

type RatingEntry = {
  place: number;
  athlete: string;
  dog: string;
  team: string;
  score: number;
  competitions: number;
};

type RatingPageProps = {
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
};

export default function RatingPage({ showToast }: RatingPageProps) {
  const [activeDiscipline, setActiveDiscipline] = useState<DisciplineType>('rh-fl-b');
  const [ratings, setRatings] = useState<Record<DisciplineType, RatingEntry[]>>({
    'rh-fl-b': [],
    'rh-t-b': [],
    'rh-f-b': []
  });
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadDebugInfo = async () => {
    try {
      console.log('[RatingPage] Loading debug info...');
      const data = await apiRequest('/rating/debug');
      console.log('[RatingPage] Debug info:', data);
      setDebugInfo(data);
      if (showToast) {
        showToast('Дані завантажено! Перегляньте консоль браузера', 'info');
      }
    } catch (e) {
      console.error('[RatingPage] Failed to load debug info:', e);
      if (showToast) {
        showToast('Помилка завантаження діагностичних даних', 'error');
      }
    }
  };

  const loadRatings = async () => {
    try {
      setLoading(true);
      
      // Load ratings for all disciplines
      const disciplines: DisciplineType[] = ['rh-fl-b', 'rh-t-b', 'rh-f-b'];
      const ratingsData: Record<DisciplineType, RatingEntry[]> = {
        'rh-fl-b': [],
        'rh-t-b': [],
        'rh-f-b': []
      };

      await Promise.all(
        disciplines.map(async (discipline) => {
          try {
            console.log(`[RatingPage] Fetching rating for ${discipline}...`);
            const data = await apiRequest(`/rating?discipline=${discipline}`);
            ratingsData[discipline] = data;
            console.log(`[RatingPage] Loaded rating for ${discipline}:`, data);
            console.log(`[RatingPage] Total entries for ${discipline}: ${data.length}`);
          } catch (e) {
            console.error(`Failed to load rating for ${discipline}:`, e);
            if (showToast) {
              showToast(`Помилка завантаження рейтингу для ${discipline}`, 'error');
            }
          }
        })
      );

      console.log('[RatingPage] All ratings loaded:', ratingsData);
      setRatings(ratingsData);
    } catch (e) {
      console.error('Failed to load ratings:', e);
      if (showToast) {
        showToast('Помилка завантаження рейтингу', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-[60px]">
      <div className="mb-8 sm:mb-12 text-left">
        <h1 className="text-4xl md:text-[48px] mb-2 text-gray-900 font-semibold">
          Рейтинг
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          Рейтинг формується на основі суми 2 кращих результатів у відбіркових змаганнях
        </p>
      </div>

      <div className="flex gap-3 mb-6 sm:mb-8 flex-wrap items-center">
        {[
          { id: 'rh-fl-b', label: 'RH-FL-B' },
          { id: 'rh-t-b', label: 'RH-T-B' },
          { id: 'rh-f-b', label: 'RH-F-B' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`px-4 sm:px-6 py-3 rounded-[10px] cursor-pointer transition-all duration-300 ${
              activeDiscipline === tab.id
                ? 'bg-[#007AFF] text-white shadow-[0_4px_12px_rgba(0,122,255,0.3)]'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
            }`}
            onClick={() => setActiveDiscipline(tab.id as DisciplineType)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {debugInfo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-[20px] p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Діагностична інформація</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>Всього змагань:</strong> {debugInfo.totalCompetitions}</p>
            <p><strong>Змагання зі статусом "completed":</strong> {debugInfo.competitions.filter((c: any) => c.status === 'completed').length}</p>
            <p><strong>Змагання з рівнем "Відбіркові" або "Відбіркові CACT":</strong> {debugInfo.competitions.filter((c: any) => c.level === 'Відбіркові' || c.level === 'Відбіркові CACT').length}</p>
            <p><strong>Учасників зі статусом "confirmed":</strong> {debugInfo.competitions.reduce((sum: number, c: any) => sum + (c.participants?.filter((p: any) => p.status === 'confirmed').length || 0), 0)}</p>
            <p><strong>Учасників з результатами (total):</strong> {debugInfo.competitions.reduce((sum: number, c: any) => sum + (c.participants?.filter((p: any) => p.total).length || 0), 0)}</p>
            
            <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="font-semibold text-blue-900 mb-2">🔍 Аналіз класів учасників:</p>
              {['rh-fl-b', 'rh-t-b', 'rh-f-b'].map(discipline => {
                const count = debugInfo.competitions.reduce((sum: number, c: any) => 
                  sum + (c.participants?.filter((p: any) => 
                    p.status === 'confirmed' && 
                    p.class === discipline && 
                    p.total
                  ).length || 0), 0);
                return (
                  <p key={discipline} className="text-sm">
                    <strong>{discipline}:</strong> {count} учасників
                  </p>
                );
              })}
              <p className="text-xs text-blue-700 mt-2">
                Унікальні значення 'class': {
                  Array.from(new Set(
                    debugInfo.competitions.flatMap((c: any) => 
                      c.participants?.map((p: any) => p.class || 'NULL') || []
                    )
                  )).join(', ')
                }
              </p>
            </div>
            
            <div className="mt-4 space-y-2">
              <p className="font-semibold">Список змагань:</p>
              {debugInfo.competitions.map((comp: any, idx: number) => (
                <div key={idx} className="bg-white p-3 rounded border">
                  <p><strong>{comp.name}</strong></p>
                  <p className="text-xs">Статус: <span className={comp.status === 'completed' ? 'text-green-600' : 'text-orange-600'}>{comp.status || 'не вказано'}</span></p>
                  <p className="text-xs">Рівень: <span className={(comp.level === 'Відбіркові' || comp.level === 'Відбіркові CACT') ? 'text-green-600' : 'text-orange-600'}>{comp.level || 'не вказано'}</span></p>
                  <p className="text-xs">Учасників: {comp.participantsCount}, Підтверджено: {comp.participants?.filter((p: any) => p.status === 'confirmed').length || 0}</p>
                  {comp.participants?.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs">Учасники</summary>
                      <ul className="ml-4 mt-1 text-xs space-y-1">
                        {comp.participants.map((p: any, pidx: number) => (
                          <li key={pidx}>
                            Class: {p.class || 'немає'}, Status: {p.status}, Total: {p.total || 'немає'}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              ))}
            </div>
            
            <details className="mt-4">
              <summary className="cursor-pointer font-semibold">Повний JSON</summary>
              <pre className="mt-2 p-4 bg-white rounded border text-xs overflow-auto max-h-96">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-[20px] p-8 sm:p-12 text-center shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <div className="text-gray-600">Завантаження рейтингу...</div>
        </div>
      ) : ratings[activeDiscipline].length === 0 ? (
        <div className="bg-white rounded-[20px] p-8 sm:p-12 text-center shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <Award className="size-12 sm:size-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-gray-900 mb-2">
            Рейтинг поки що порожній
          </h3>
          <p className="text-gray-600">
            Після завершення відбіркових змагань тут з'явиться рейтинг учасників
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-4 text-left text-gray-900">Місце</th>
                  <th className="p-4 text-left text-gray-900">Спортсмен</th>
                  <th className="p-4 text-left text-gray-900">Собака</th>
                  <th className="p-4 text-left text-gray-900">Команда</th>
                  <th className="p-4 text-left text-gray-900">Бали</th>
                  <th className="p-4 text-left text-gray-900">Змагання</th>
                </tr>
              </thead>
              <tbody>
                {ratings[activeDiscipline].map((item) => (
                  <tr
                    key={`${item.place}-${item.athlete}-${item.dog}`}
                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4 text-gray-700">{item.place}</td>
                    <td className="p-4 text-gray-700">{item.athlete}</td>
                    <td className="p-4 text-gray-700">{item.dog}</td>
                    <td className="p-4 text-gray-700">{item.team}</td>
                    <td className="p-4">
                      <span className="text-[#007AFF]">{item.score}</span>
                    </td>
                    <td className="p-4 text-gray-700">{item.competitions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden grid gap-4 p-4 sm:p-5">
            {ratings[activeDiscipline].map((item) => (
              <div
                key={`${item.place}-${item.athlete}-${item.dog}`}
                className="bg-gray-50 rounded-xl p-4 sm:p-5"
              >
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                  <div className="text-gray-700">
                    #{item.place}
                  </div>
                  <div className="text-[#007AFF]">{item.score} балів</div>
                </div>

                <div className="flex flex-col gap-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 uppercase tracking-wide">Спортсмен</span>
                    <span className="text-gray-900 text-right">{item.athlete}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 uppercase tracking-wide">Собака</span>
                    <span className="text-gray-900 text-right">{item.dog}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 uppercase tracking-wide">Команда</span>
                    <span className="text-gray-900 text-right">{item.team}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 uppercase tracking-wide">Змагань</span>
                    <span className="text-gray-900 text-right">{item.competitions}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}