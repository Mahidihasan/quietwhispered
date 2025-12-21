import React, { useState } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';

const SortFilter = ({ filters, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const contentTypes = ['story', 'memory', 'journey', 'image', 'video'];

    const handleSortChange = (e) => {
        onChange({ sort: e.target.value });
    };

    const handleTypeChange = (type) => {
        onChange({ type: filters.type === type ? '' : type });
    };

    return (
        <div className="sort-filter-wrapper">
            <button 
                className="filter-toggle"
                onClick={() => setIsOpen(!isOpen)}
                title="Toggle filters"
            >
                <FiFilter size={24} />
            </button>

            {isOpen && (
                <div className="filter-panel">
                    <div className="filter-header">
                        <h3>Filter & Sort</h3>
                        <button 
                            className="close-button"
                            onClick={() => setIsOpen(false)}
                        >
                            <FiX size={20} />
                        </button>
                    </div>

                    <div className="filter-section">
                        <label>Sort By</label>
                        <select value={filters.sort} onChange={handleSortChange} className="filter-select">
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="type">By Type</option>
                            <option value="mood">By Mood</option>
                        </select>
                    </div>

                    <div className="filter-section">
                        <label>Content Type</label>
                        <div className="filter-buttons">
                            {contentTypes.map(type => (
                                <button
                                    key={type}
                                    className={`filter-button ${filters.type === type ? 'active' : ''}`}
                                    onClick={() => handleTypeChange(type)}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filters.type && (
                        <button
                            className="clear-filter"
                            onClick={() => {
                                onChange({ type: '' });
                                setIsOpen(false);
                            }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default SortFilter;
