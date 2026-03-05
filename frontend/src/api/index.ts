import { mockAuthApi, mockLocationApi, mockReviewApi } from './mockClient';
// import { realAuthApi, ... } from './realClient'; // Future

// Toggle this via .env VITE_USE_MOCK=false
const USE_MOCK = true;

export const api = {
    auth: USE_MOCK ? mockAuthApi : mockAuthApi, // Fallback to mock for now
    location: USE_MOCK ? mockLocationApi : mockLocationApi,
    review: USE_MOCK ? mockReviewApi : mockReviewApi
};
