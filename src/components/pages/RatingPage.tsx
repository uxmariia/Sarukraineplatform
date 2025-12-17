import { useState } from 'react';

type DisciplineType = 'rh-fl-b' | 'rh-t-b' | 'rh-f-b';

export default function RatingPage() {
  const [activeDiscipline, setActiveDiscipline] = useState<DisciplineType>('rh-fl-b');

  const ratings = {
    'rh-fl-b': [
      { place: 1, athlete: 'Олександр Коваленко', dog: 'Рекс', team: 'Київська команда SAR', score: 150 },
      { place: 2, athlete: 'Марина Петренко', dog: 'Альфа', team: 'Львівські рятувальники', score: 145 },
      { place: 3, athlete: 'Іван Шевченко', dog: 'Грей', team: 'Одеська команда', score: 138 },
    ],
    'rh-t-b': [
      { place: 1, athlete: 'Дмитро Сидоренко', dog: 'Буран', team: 'Харківська команда', score: 145 },
      { place: 2, athlete: 'Юлія Ткаченко', dog: 'Леді', team: 'Київська команда SAR', score: 142 },
    ],
    'rh-f-b': [
      { place: 1, athlete: 'Андрій Мельник', dog: 'Тор', team: 'Дніпровська команда', score: 140 },
      { place: 2, athlete: 'Оксана Бойко', dog: 'Бетті', team: 'Львівські рятувальники', score: 135 },
    ],
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-[60px]">
      <div className="mb-12 text-left">
        <h1 className="text-5xl md:text-[48px] mb-2 bg-gradient-to-br from-white to-indigo-300 bg-clip-text text-transparent">
          Рейтинг
        </h1>
        <p className="text-lg text-slate-400">Рейтинг спортсменів за різними дисциплінами</p>
      </div>

      <div className="flex gap-3 mb-8 flex-wrap">
        {[
          { id: 'rh-fl-b', label: 'RH-FL-B' },
          { id: 'rh-t-b', label: 'RH-T-B' },
          { id: 'rh-f-b', label: 'RH-F-B' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`px-6 py-3 border rounded-[10px] cursor-pointer transition-all duration-300 ${
              activeDiscipline === tab.id
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent'
                : 'bg-[rgba(30,41,59,0.5)] border-[rgba(99,102,241,0.2)] text-slate-400 hover:bg-[rgba(99,102,241,0.1)] hover:border-[rgba(99,102,241,0.4)]'
            }`}
            onClick={() => setActiveDiscipline(tab.id as DisciplineType)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.2)] rounded-[20px] overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[rgba(99,102,241,0.15)]">
                <th className="p-4 text-left text-white">Місце</th>
                <th className="p-4 text-left text-white">Спортсмен</th>
                <th className="p-4 text-left text-white">Собака</th>
                <th className="p-4 text-left text-white">Команда</th>
                <th className="p-4 text-left text-white">Бали</th>
              </tr>
            </thead>
            <tbody>
              {ratings[activeDiscipline].map((item) => (
                <tr
                  key={item.place}
                  className="border-t border-[rgba(99,102,241,0.1)] hover:bg-[rgba(99,102,241,0.05)]"
                >
                  <td className="p-4 text-slate-400">{item.place}</td>
                  <td className="p-4 text-slate-400">{item.athlete}</td>
                  <td className="p-4 text-slate-400">{item.dog}</td>
                  <td className="p-4 text-slate-400">{item.team}</td>
                  <td className="p-4 text-slate-400">{item.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden grid gap-4 p-5">
          {ratings[activeDiscipline].map((item) => (
            <div
              key={item.place}
              className="bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.2)] rounded-xl p-5"
            >
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-[rgba(99,102,241,0.2)]">
                <div className="text-3xl bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                  {item.place}
                </div>
                <div className="text-2xl text-indigo-300">{item.score} балів</div>
              </div>

              <div className="flex flex-col gap-[10px]">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Спортсмен</span>
                  <span className="text-gray-200 text-right">{item.athlete}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Собака</span>
                  <span className="text-gray-200 text-right">{item.dog}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Команда</span>
                  <span className="text-gray-200 text-right">{item.team}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
