import axiosInstance from './axiosInstance';

export const fetchSearchResultsFromAPI = async (query) => {
    try {
        const response = await axiosInstance.get(
            `/openfoodfacts/search?query=${encodeURIComponent(query)}`
        );
        return response.data.data || [];
    } catch (error) {
        console.error('Error fetching search results:', error);
        return [];
    }
};

export const fetchDietProductsFromAPI = async (typeOfDiet) => {
    try {
        const response = await axiosInstance.get(
            `/openfoodfacts/diet?dietType=${encodeURIComponent(typeOfDiet)}`
        );
        return response.data.data || [];
    } catch (error) {
        console.error('Error fetching diet products:', error);
        return [];
    }
};

export const fetchProductDataFromAPI = async (barcode) => {
    try {
        const response = await axiosInstance.get(`/openfoodfacts/product/${barcode}`);
        return response.data.data || null;
    } catch (error) {
        console.error('Error fetching product details:', error);
        return null;
    }
};