/**
 * Extracts birthdate and gender from a Sri Lankan National Identity Card (NIC) number.
 * Supports both Old (9 digits + V/X) and New (12 digits) formats.
 * 
 * CRITICAL RULE: The Sri Lankan DRP algorithm treats EVERY year as a leap year for sequence numbering.
 * February ALWAYS has exactly 29 days, even in standard/non-leap years.
 * 
 * @param {string} nicNumber 
 * @returns {object|null} { format, birthdate, gender } or null if invalid
 */
export function extractNicDetails(nicNumber) {
    if (!nicNumber) return null;
    const nic = String(nicNumber).trim().toUpperCase();
    let yearStr = "";
    let dayStr = "";
    
    if (nic.length === 10 && /^\d{9}$/.test(nic.slice(0, 9)) && ['V', 'X'].includes(nic[9])) {
        // Old Format (e.g., 950651234V)
        yearStr = "19" + nic.substring(0, 2);
        dayStr = nic.substring(2, 5);
    } else if (nic.length === 12 && /^\d{12}$/.test(nic)) {
        // New Format (e.g., 199506501234)
        yearStr = nic.substring(0, 4);
        dayStr = nic.substring(4, 7);
    } else {
        return null;
    }
    
    const year = parseInt(yearStr, 10);
    const dayValue = parseInt(dayStr, 10);
    
    if (isNaN(year) || isNaN(dayValue)) {
        return null;
    }
    
    let gender = "Male";
    let daysToAdd = dayValue;
    if (dayValue > 500) {
        gender = "Female";
        daysToAdd = dayValue - 500;
    }
    
    if (daysToAdd < 1 || daysToAdd > 366) {
        return null;
    }
    
    // Fixed month lengths (February is ALWAYS 29 days)
    const monthLengths = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    let remainingDays = daysToAdd;
    let monthIndex = 0;
    while (monthIndex < 12 && remainingDays > monthLengths[monthIndex]) {
        remainingDays -= monthLengths[monthIndex];
        monthIndex++;
    }
    
    if (monthIndex >= 12) {
        return null; // Exceeded 366 days
    }
    
    const monthStr = String(monthIndex + 1).padStart(2, '0');
    const dateStr = String(remainingDays).padStart(2, '0');
    const birthdateString = `${year}-${monthStr}-${dateStr}`;
    
    return {
        format: nic.length === 10 ? "Old" : "New",
        birthdate: birthdateString,
        gender: gender
    };
}
