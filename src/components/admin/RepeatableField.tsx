'use client';

interface RepeatableTextProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export function RepeatableText({ label, items, onChange, placeholder = 'Enter item...' }: RepeatableTextProps) {
  const addItem = () => onChange([...items, '']);
  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));
  const updateItem = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-dark-300 mb-2">{label}</label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="px-3 py-2 text-dark-400 hover:text-error-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        className="mt-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
      >
        + Add item
      </button>
    </div>
  );
}

interface FAQItem {
  question: string;
  answer: string;
}

interface RepeatableFAQProps {
  label: string;
  items: FAQItem[];
  onChange: (items: FAQItem[]) => void;
}

export function RepeatableFAQ({ label, items, onChange }: RepeatableFAQProps) {
  const addItem = () => onChange([...items, { question: '', answer: '' }]);
  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-dark-300 mb-2">{label}</label>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="bg-dark-800/50 rounded-lg p-4 border border-dark-700">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-dark-500">FAQ #{index + 1}</span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-dark-400 hover:text-error-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              value={item.question}
              onChange={(e) => updateItem(index, 'question', e.target.value)}
              placeholder="Question"
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <textarea
              value={item.answer}
              onChange={(e) => updateItem(index, 'answer', e.target.value)}
              placeholder="Answer"
              rows={2}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        className="mt-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
      >
        + Add FAQ
      </button>
    </div>
  );
}

interface SectionItem {
  title: string;
  items: string[];
}

interface RepeatableSectionsProps {
  label: string;
  items: SectionItem[];
  onChange: (items: SectionItem[]) => void;
}

export function RepeatableSections({ label, items, onChange }: RepeatableSectionsProps) {
  const addItem = () => onChange([...items, { title: '', items: [] }]);
  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));
  const updateTitle = (index: number, title: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], title };
    onChange(updated);
  };
  const updateSectionItems = (index: number, itemsText: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], items: itemsText.split('\n').filter(Boolean) };
    onChange(updated);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-dark-300 mb-2">{label}</label>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="bg-dark-800/50 rounded-lg p-4 border border-dark-700">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-dark-500">Section #{index + 1}</span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-dark-400 hover:text-error-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              value={item.title}
              onChange={(e) => updateTitle(index, e.target.value)}
              placeholder="Section title"
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <textarea
              value={item.items.join('\n')}
              onChange={(e) => updateSectionItems(index, e.target.value)}
              placeholder="One item per line"
              rows={3}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        className="mt-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
      >
        + Add section
      </button>
    </div>
  );
}
