import {
  TRangeSearchFilter,
  TSearchFilter,
  TSearchQuery,
  TTextSearchFilter,
} from '../interface/searchQuery';

class SearchQueryBuilder {
  private searchQuery: TSearchQuery;

  constructor(indexName: string) {
    this.searchQuery = { index: indexName };
  }

  addMustFilter(filter: TTextSearchFilter): SearchQueryBuilder {
    if (!this.searchQuery.compound) {
      this.searchQuery.compound = {};
    }
    if (!this.searchQuery.compound.must) {
      this.searchQuery.compound.must = [];
    }
    this.searchQuery.compound.must.push(filter);
    return this;
  }

  addShouldFilter(filter: TSearchFilter[]): SearchQueryBuilder {
    if (!this.searchQuery.compound) {
      this.searchQuery.compound = {};
    }
    if (!this.searchQuery.compound.should) {
      this.searchQuery.compound.should = [];
    }
    this.searchQuery.compound.should.push(...filter);
    return this;
  }

  addMustNotFilter(filter: TTextSearchFilter): SearchQueryBuilder {
    if (!this.searchQuery.compound) {
      this.searchQuery.compound = {};
    }
    if (!this.searchQuery.compound.mustNot) {
      this.searchQuery.compound.mustNot = [];
    }
    this.searchQuery.compound.mustNot.push(filter);
    return this;
  }

  addFilter(filter: TTextSearchFilter): SearchQueryBuilder {
    if (!this.searchQuery.compound) {
      this.searchQuery.compound = {};
    }
    if (!this.searchQuery.compound.filter) {
      this.searchQuery.compound.filter = [];
    }
    this.searchQuery.compound.filter.push(filter);
    return this;
  }

  addRangeFilter(filter: TRangeSearchFilter): SearchQueryBuilder {
    if (!this.searchQuery.compound) {
      this.searchQuery.compound = {};
    }
    if (!this.searchQuery.compound.filter) {
      this.searchQuery.compound.filter = [];
    }
    this.searchQuery.compound.filter.push(filter);
    return this;
  }

  build(): TSearchQuery {
    return this.searchQuery;
  }
}

export default SearchQueryBuilder;
