// truncate company name

function formatCompanyName(companyName: string): string {
  let formattedName = companyName
    .replace('PRIVATE LIMITED', 'PVT LTD')
    .replace('LIMITED', 'Ltd')
    .replace('LLP', 'LLP')
    .trim();

  // Trim to 30 characters if necessary
  if (formattedName.length > 30) {
    formattedName = formattedName.slice(0, 27) + '...'; // Add ellipsis for indication
  }

  return formattedName;
}

export default formatCompanyName;
