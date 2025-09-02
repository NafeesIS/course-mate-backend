// schema.ts
import { model, Schema } from 'mongoose';
import {
  IBookmark,
  ICategory,
  IComment,
  IDoc,
  IDocTag,
  IMedia,
  IReply,
  ISubcategory,
  ITag,
} from './doc.interface';

// Subschemas
const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    metaTitle: {
      type: String,
      required: true,
    },
    metaDescription: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      required: true,
      default: 'active',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const subcategorySchema = new Schema<ISubcategory>(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    metaTitle: {
      type: String,
      required: true,
    },
    metaDescription: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      required: true,
      default: 'active',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isHomepage: { type: Boolean, default: false },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'doc_categories',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const tagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const docTagsSchema = new Schema<IDocTag>(
  {
    tagId: {
      type: Schema.Types.ObjectId,
      ref: 'tags',
      required: true,
    },
    docId: {
      type: Schema.Types.ObjectId,
      ref: 'docs',
      required: true,
    },
  },
  { timestamps: true }
);

const bookmarkSchema = new Schema<IBookmark>(
  {
    docId: {
      type: Schema.Types.ObjectId,
      ref: 'docs',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const commentSchema = new Schema<IComment>(
  {
    commentedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    docId: {
      type: Schema.Types.ObjectId,
      ref: 'docs',
      required: true,
    },
    commentText: { type: String, required: true },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const replySchema = new Schema<IReply>(
  {
    commentId: {
      type: Schema.Types.ObjectId,
      ref: 'doc_comments',
      required: true,
    },
    repliedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    replyText: { type: String, required: true },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const mediaSchema = new Schema<IMedia>(
  {
    url: { type: String, required: true },
    title: { type: String, required: true, unique: true },
    type: { type: String, enum: ['image', 'jpeg', 'video', 'mp4'], required: true },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const docSchema = new Schema<IDoc>(
  {
    title: {
      type: String,
      unique: true,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
    },
    metaTitle: {
      type: String,
      required: true,
    },
    metaDescription: {
      type: String,
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    headerImageId: {
      type: Schema.Types.ObjectId,
      ref: 'doc_medias',
      required: true,
    },
    thumbnailId: {
      type: Schema.Types.ObjectId,
      ref: 'doc_medias',
    },
    mediaIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'doc_medias',
      },
    ],
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      required: true,
    },
    tagIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'tags',
        required: true,
      },
    ],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'doc_categories',
      required: true,
    },
    subcategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'doc_subcategories',
      required: false,
    },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
    isDeleted: { type: Boolean, default: false },
    isHomepage: { type: Boolean, default: false },
    likeCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.pre('save', async function (next) {
  const existingSubcategory = await SubcategoryModel.findOne({
    $or: [{ name: this.name }, { slug: this.slug }],
    isDeleted: false,
  });

  if (existingSubcategory) {
    return next(
      new Error(
        'Category name or slug already exists in subcategories. Please choose a different one.'
      )
    );
  }

  const existingCategory = await CategoryModel.findOne({
    $or: [{ name: this.name }, { slug: this.slug }],
    _id: { $ne: this._id }, // exclude current doc if updating
    isDeleted: false,
  });

  if (existingCategory) {
    return next(
      new Error(
        'Category name or slug already exists in categories. Please choose a different one.'
      )
    );
  }

  next();
});

categorySchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (Array.isArray(update)) return next();
  if (!update || typeof update !== 'object') return next();
  const name = update.name;
  const slug = update.slug;
  if (!name && !slug) return next();
  const conditions = [];
  if (name) conditions.push({ name });
  if (slug) conditions.push({ slug });
  const docBeingUpdated = await this.model.findOne(this.getQuery());
  if (!docBeingUpdated) return next();
  const [existingSubcategory, existingCategory] = await Promise.all([
    SubcategoryModel.findOne({ $or: conditions, isDeleted: false }),
    CategoryModel.findOne({
      $or: conditions,
      _id: { $ne: docBeingUpdated._id },
      isDeleted: false,
    }),
  ]);
  if (existingSubcategory) {
    return next(
      new Error(
        'Category name or slug already exists in subcategories. Please choose a different one.'
      )
    );
  }
  if (existingCategory) {
    return next(
      new Error(
        'Category name or slug already exists in other categories. Please choose a different one.'
      )
    );
  }
  next();
});

subcategorySchema.pre('save', async function (next) {
  // Check against existing categories
  const existingCategory = await CategoryModel.findOne({
    $or: [{ name: this.name }, { slug: this.slug }],
    isDeleted: false,
  });

  if (existingCategory) {
    return next(
      new Error(
        'Subcategory name or slug already exists in categories. Please choose a different one.'
      )
    );
  }

  // Check against existing subcategories (excluding current if updating)
  const existingSubcategory = await SubcategoryModel.findOne({
    $or: [{ name: this.name }, { slug: this.slug }],
    _id: { $ne: this._id },
    isDeleted: false,
  });

  if (existingSubcategory) {
    return next(
      new Error(
        'Subcategory name or slug already exists in subcategories. Please choose a different one.'
      )
    );
  }

  next();
});

subcategorySchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (Array.isArray(update)) return next();
  if (!update || typeof update !== 'object') return next();
  const name = update.name;
  const slug = update.slug;
  if (!name && !slug) return next();
  const conditions = [];
  if (name) conditions.push({ name });
  if (slug) conditions.push({ slug });
  const docBeingUpdated = await this.model.findOne(this.getQuery());
  if (!docBeingUpdated) return next();
  const [existingCategory, existingSubcategory] = await Promise.all([
    CategoryModel.findOne({ $or: conditions, isDeleted: false }),
    SubcategoryModel.findOne({
      $or: conditions,
      _id: { $ne: docBeingUpdated._id },
      isDeleted: false,
    }),
  ]);
  if (existingCategory) {
    return next(
      new Error(
        'Subcategory name or slug already exists in categories. Please choose a different one.'
      )
    );
  }
  if (existingSubcategory) {
    return next(
      new Error(
        'Subcategory name or slug already exists in subcategories. Please choose a different one.'
      )
    );
  }
  next();
});

// Models
export const DocModel = model('all_docs', docSchema);
export const DocMediaModel = model('doc_medias', mediaSchema);
export const BookmarkModel = model('bookmarks', bookmarkSchema);
export const CategoryModel = model('doc_categories', categorySchema);
export const SubcategoryModel = model('doc_subcategories', subcategorySchema);
export const TagModel = model('tags', tagSchema);
export const DocTagModel = model('doc_tags', docTagsSchema);
export const DocCommentModel = model('doc_comments', commentSchema);
export const DocReplyModel = model('doc_replies', replySchema);
