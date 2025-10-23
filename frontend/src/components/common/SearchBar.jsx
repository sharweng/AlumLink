import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2">
      <input
        type="text"
        className="input input-bordered w-full"
        placeholder="Search AlumniLink..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <button type="submit" className="btn btn-primary">Search</button>
    </form>
  );
};

export default SearchBar;
