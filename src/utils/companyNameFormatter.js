/**
 * Company Name Formatting Utilities
 * Ensures proper casing for company names
 */

/**
 * Convert company name to proper title case
 * Handles special cases like IKEA, IBM, McDonald's, etc.
 */
function toProperCompanyCase(name) {
  if (!name) return name;
  
  const trimmed = name.trim();
  
  // Known all-caps companies
  const allCapsCompanies = [
    'IKEA', 'IBM', 'HP', 'AT&T', '3M', 'GE', 'BMW', 'KFC', 'LG', 
    'SAP', 'AMD', 'NVIDIA', 'ASUS', 'HSBC', 'UPS', 'FedEx'
  ];
  
  const upperName = trimmed.toUpperCase();
  const allCapsMatch = allCapsCompanies.find(c => c === upperName || upperName.includes(c));
  if (allCapsMatch) return allCapsMatch;
  
  // Special case handling
  const specialCases = {
    'LEVI STRAUSS': 'Levi Strauss',
    'JPMORGAN': 'JPMorgan',
    'JPMORGAN CHASE': 'JPMorgan Chase',
    'GOLDMAN SACHS': 'Goldman Sachs',
    'MORGAN STANLEY': 'Morgan Stanley',
    'WELLS FARGO': 'Wells Fargo',
    'BANK OF AMERICA': 'Bank of America'
  };
  
  if (specialCases[upperName]) {
    return specialCases[upperName];
  }
  
  // Title case each word
  return trimmed
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Handle apostrophes (O'Reilly, McDonald's)
      if (word.includes("'")) {
        return word.split("'").map(part => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join("'");
      }
      
      // Handle Mc/Mac prefixes
      if (word.startsWith('mc') && word.length > 2) {
        return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3);
      }
      if (word.startsWith('mac') && word.length > 3) {
        return 'Mac' + word.charAt(3).toUpperCase() + word.slice(4);
      }
      
      // Handle lowercase articles/prepositions (if not first word)
      const lowercase = ['and', 'of', 'the', 'for', 'in', 'on', 'at', 'to', 'a', 'an'];
      if (index > 0 && lowercase.includes(word)) {
        return word;
      }
      
      // Regular title case
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

module.exports = {
  toProperCompanyCase
};

