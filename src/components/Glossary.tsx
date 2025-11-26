import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

type GlossaryEntry = {
  section: string;
  columnName: string;
  description: string;
  dataValues?: string;
  dataUnit?: string;
  dataSource?: string;
  note?: string;
};

const DICTIONARY_PATH = '/data/NCAA Basketball Dictionary.xlsx';

export function Glossary() {
  const [entries, setEntries] = useState<GlossaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<string>('All');

  useEffect(() => {
    const loadDictionary = async () => {
      try {
        setLoading(true);
        const response = await fetch(DICTIONARY_PATH);
        if (!response.ok) {
          throw new Error(`Unable to load glossary file (${response.statusText})`);
        }
        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheet = workbook.Sheets['Dict'] ?? workbook.Sheets[workbook.SheetNames[0]];
        if (!sheet) {
          throw new Error('Dictionary sheet "Dict" not found.');
        }
        const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1 });
        const parsed: GlossaryEntry[] = [];
        let currentSection = 'General';

        rows.forEach((row) => {
          if (!row || row.length === 0) return;
          const maybeSection = (row[2] ?? '').toString().trim();
          if ((!row[0] && !row[1] && maybeSection) || (row[1] && !row[2] && !row[3])) {
            currentSection = maybeSection || (row[1]?.toString().trim() ?? currentSection);
            return;
          }

          const columnName = row[1]?.toString().trim();
          if (!columnName || columnName === 'Column Name') return;

          parsed.push({
            section: currentSection,
            columnName,
            description: row[2]?.toString().trim() || '—',
            dataValues: row[3]?.toString().trim() || '',
            dataUnit: row[4]?.toString().trim() || '',
            dataSource: row[5]?.toString().trim() || '',
            note: row[6]?.toString().trim() || '',
          });
        });

        setEntries(parsed);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load glossary.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadDictionary();
  }, []);

  const filteredEntries = useMemo(() => {
    if (!search) return entries;
    const term = search.toLowerCase();
    return entries.filter((entry) =>
      [entry.columnName, entry.description, entry.dataValues, entry.dataUnit, entry.dataSource, entry.note]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  }, [entries, search]);

  const sections = useMemo(() => {
    const uniqueSections: string[] = [];
    filteredEntries.forEach((entry) => {
      if (!uniqueSections.includes(entry.section)) {
        uniqueSections.push(entry.section);
      }
    });
    return ['All', ...uniqueSections];
  }, [filteredEntries]);

  const sectionedEntries = useMemo(() => {
    if (activeSection === 'All') {
      return sections.slice(1).map(section => ({
        section,
        rows: filteredEntries.filter(entry => entry.section === section),
      }));
    }
    return [
      {
        section: activeSection,
        rows: filteredEntries.filter(entry => entry.section === activeSection),
      },
    ];
  }, [filteredEntries, sections, activeSection]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-2xl font-semibold text-text-main">Loading glossary…</p>
          <p className="text-gray-600">Fetching NCAA data dictionary</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-xl text-center space-y-3">
          <p className="text-2xl font-semibold text-red-600">Unable to load glossary</p>
          <p className="text-gray-700">{error}</p>
          <p className="text-sm text-gray-500">
            Please confirm the file exists at <code className="bg-gray-100 px-2 py-1 rounded">{DICTIONARY_PATH}</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Glossary</p>
          <h1 className="text-3xl font-bold text-text-main">Data Dictionary</h1>
          <p className="text-gray-600">
            Definitions and metadata for every column in the NCAA Basketball datasets.
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-md border border-cream/70 p-4 sm:p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="glossary-search">
            Search terms
          </label>
          <input
            id="glossary-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search column names, descriptions, units…"
            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          <p className="mt-2 text-xs text-gray-500">{filteredEntries.length} entries</p>
        </div>

        {sections.length === 1 ? (
          <div className="bg-white rounded-2xl shadow-md border border-cream/70 p-8 text-center text-gray-500">
            No glossary entries match your search.
          </div>
        ) : (
          <>
            <section>
              <div className="inline-flex rounded-full bg-white border border-cream/60 p-1 shadow-sm overflow-x-auto">
                {sections.map((section) => (
                  <button
                    key={section}
                    type="button"
                    onClick={() => setActiveSection(section)}
                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                      activeSection === section ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:text-primary'
                    }`}
                  >
                    {section}
                  </button>
                ))}
              </div>
            </section>
            {sectionedEntries.map(({ section, rows }) => (
              <section key={section} className="bg-white rounded-2xl shadow-md border border-cream/70">
                <div className="px-5 py-4 border-b border-cream/60 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-text-main">{section}</h2>
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    {rows.length} columns
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-cream/40 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      <tr>
                        <Th>Column</Th>
                        <Th>Description</Th>
                        <Th>Data Values</Th>
                        <Th>Unit</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rows.map((entry) => (
                        <tr key={`${section}-${entry.columnName}`} className="hover:bg-cream/20 transition-colors">
                          <Td className="font-semibold text-text-main">{entry.columnName}</Td>
                          <Td>{entry.description || '—'}</Td>
                          <Td>{entry.dataValues || '—'}</Td>
                          <Td>{entry.dataUnit || '—'}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">{children}</th>;
}

function Td({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-5 py-3 text-sm text-gray-700 align-top ${className}`}>{children}</td>;
}


