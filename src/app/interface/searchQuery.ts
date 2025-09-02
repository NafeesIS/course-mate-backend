export type TTextSearchFilter = {
  text: {
    query: string | string[];
    path: string | string[];
    fuzzy?:
      | boolean
      | {
          maxEdits?: number;
          prefixLength?: number;
        };
  };
};

type TAutocompleteFilter = {
  autocomplete: {
    query: string;
    path: string;
    tokenOrder: 'sequential' | 'any';
  };
};

export type TRangeSearchFilter = {
  range: {
    path: string;
    gte?: number; // Greater than or equal to
    lte?: number; // Less than or equal to
    gt?: number; // Greater than
    lt?: number; // Less than
  };
};

export type PaidUpCapitalRange = {
  lower: number; // Lower boundary inclusive
  upper: number; // Upper boundary exclusive
};

// Define a union type for filters
export type TSearchFilter = TTextSearchFilter | TRangeSearchFilter | TAutocompleteFilter;

export type CompoundSearchCriteria = {
  must?: TSearchFilter[];
  should?: TSearchFilter[];
  mustNot?: TSearchFilter[];
  filter?: TSearchFilter[];
};

export type TSearchQuery = {
  index: string;
  compound?: CompoundSearchCriteria;
  highlight?: { path: string | string[] };
};

// Define the structure of a facet option
export type TFacetOption = {
  type: 'string';
  path: string;
  numBuckets?: number;
};

export type TSearchMetaFacet = {
  operator: {
    compound: {
      must?: TSearchFilter[];
      should?: TSearchFilter[];
      filter?: TSearchFilter[];
    };
  };
  facets: { [key: string]: TFacetOption };
};

// Define the overall structure of the search meta query
export type TSearchMetaQuery = {
  index: string;
  facet: TSearchMetaFacet;
};
