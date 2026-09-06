export default function TourFilters({ filters, onFilterChange }) {
  return (
    <div className="grid md:grid-cols-5 gap-3 mb-8">
      <input
        value={filters.destination}
        onChange={(e) => onFilterChange('destination', e.target.value)}
        placeholder="Destination"
        className="border rounded-xl p-3"
      />
      <input
        value={filters.category}
        onChange={(e) => onFilterChange('category', e.target.value)}
        placeholder="Category"
        className="border rounded-xl p-3"
      />
      <input
        value={filters.minPrice}
        onChange={(e) => onFilterChange('minPrice', e.target.value)}
        placeholder="Min price"
        type="number"
        className="border rounded-xl p-3"
      />
      <input
        value={filters.maxPrice}
        onChange={(e) => onFilterChange('maxPrice', e.target.value)}
        placeholder="Max price"
        type="number"
        className="border rounded-xl p-3"
      />
      <input
        value={filters.duration}
        onChange={(e) => onFilterChange('duration', e.target.value)}
        placeholder="Duration"
        className="border rounded-xl p-3"
      />
    </div>
  );
}
