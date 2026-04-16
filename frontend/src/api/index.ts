import { 
    realAuthApi, 
    realUserApi, 
    realLocationApi, 
    realReviewApi, 
    realVisitApi, 
    realUploadApi, 
    realBehaviorApi, 
    realTagApi, 
    realCategoryApi, 
    realFavoriteApi, 
    realBlogApi, 
    realNewsletterApi,
    realAdminApi,
    apiClient 
} from './realClient';

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
    admin: realAdminApi,
    client: apiClient
};
