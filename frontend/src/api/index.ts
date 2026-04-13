import { realAuthApi, realUserApi, realLocationApi, realReviewApi, realVisitApi, realUploadApi, realBehaviorApi, realTagApi, realCategoryApi, realFavoriteApi, realBlogApi, realNewsletterApi, apiClient } from './realClient';

export const api = {
    auth: realAuthApi,
    user: realUserApi,
    location: realLocationApi,
    review: realReviewApi,
    visit: realVisitApi,
    upload: realUploadApi,
    behavior: realBehaviorApi,
    tag: realTagApi,
    category: realCategoryApi,
    favorite: realFavoriteApi,
    blog: realBlogApi,
    newsletter: realNewsletterApi,
    client: apiClient
};
