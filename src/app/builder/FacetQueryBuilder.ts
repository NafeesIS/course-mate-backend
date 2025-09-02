import { TSearchFilter, TSearchMetaQuery, TTextSearchFilter } from '../interface/searchQuery';

class FacetQueryBuilder {
  private searchMeta: TSearchMetaQuery;

  constructor(indexName: string) {
    this.searchMeta = {
      index: indexName,
      facet: {
        operator: {
          compound: {},
        },
        facets: {},
      },
    };
  }

  addMustFilter(filter: TTextSearchFilter): FacetQueryBuilder {
    // if (query) {
    //   const mustFilter: TTextSearchFilter = {
    //     text: {
    //       query: query,
    //       path: path,
    //       fuzzy: { maxEdits: fuzzyMaxEdits },
    //     },
    //   };
    if (!this.searchMeta.facet.operator.compound.must) {
      this.searchMeta.facet.operator.compound.must = [];
    }
    this.searchMeta.facet.operator.compound.must.push(filter);
    return this;
  }

  addShouldFilter(filter: TSearchFilter[]): FacetQueryBuilder {
    if (!this.searchMeta.facet.operator.compound) {
      this.searchMeta.facet.operator.compound = {};
    }
    if (!this.searchMeta.facet.operator.compound.should) {
      this.searchMeta.facet.operator.compound.should = [];
    }
    this.searchMeta.facet.operator.compound.should.push(...filter);
    return this;
  }

  addFilter(filter: TTextSearchFilter): FacetQueryBuilder {
    if (!this.searchMeta.facet.operator.compound.filter) {
      this.searchMeta.facet.operator.compound.filter = [];
    }
    this.searchMeta.facet.operator.compound.filter.push(filter);
    return this;
  }

  addFacet(
    name: string,
    path: string,
    type: 'string' = 'string',
    numBuckets?: number
  ): FacetQueryBuilder {
    this.searchMeta.facet.facets[name] = { type, path, ...(numBuckets ? { numBuckets } : {}) };
    return this;
  }

  build(): TSearchMetaQuery {
    // return [{ $searchMeta: this.searchMeta }];
    return this.searchMeta;
  }
}

export default FacetQueryBuilder;
