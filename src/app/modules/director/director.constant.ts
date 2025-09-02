export const directorSearchSuggestionProjectStage = {
  $project: {
    din: '$din',
    fullName: '$fullName',
    dinAllocationDate: '$dinAllocationDate',
    status: '$status',
    personType: '$personType',
    totalDirectorshipCount: 1,
    // companies: '$companyData.nameOfTheCompany',
    companies: '$filteredCompanyData.nameOfTheCompany',
    score: { $meta: 'searchScore' },
    highlight: { $meta: 'searchHighlights' },
  },
};
