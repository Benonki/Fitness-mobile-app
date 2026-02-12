const axios = require('axios');

exports.searchProducts = async (query) => {
    try {
        const response = await axios.get(
            `${process.env.OPENFOODFACTS_API_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1`,
            { timeout: 20000 }
        );
        return response.data.products || [];
    } catch (error) {
        console.error('Błąd przy pobieraniu wyników wyszukiwania:', error);
        throw new Error('Nie udało się pobrać wyników wyszukiwania');
    }
};

exports.getDietProducts = async (typeOfDiet) => {
    try {
        const randomPage = Math.floor(Math.random() * 1000) + 1;
        const response = await axios.get(
            `${process.env.OPENFOODFACTS_API_URL}/cgi/search.pl?search_simple=1&action=process&json=1&page=${randomPage}`,
            { timeout: 20000 }
        );

        if (response.data && Array.isArray(response.data.products)) {
            const products = response.data.products.filter((product) => {
                if (!product.nutriments) return false;

                if (typeOfDiet === 'Utrata wagi') {
                    if (product.product_name && (product.product_name.includes('Coca-Cola') || product.product_name.includes('Coca Cola'))) {
                        return false;
                    }
                    return product.nutriments['energy-kcal_100g'] < 155;
                }

                if (typeOfDiet === 'Przybieranie na wadze') {
                    return product.nutriments['energy-kcal_100g'] > 500;
                }

                if (typeOfDiet === 'Utrzymanie wagi') {
                    if (product.product_name && (product.product_name.includes('Coca-Cola') || product.product_name.includes('Coca Cola'))) {
                        return false;
                    }
                    return product.nutriments['energy-kcal_100g'] > 155 && product.nutriments['energy-kcal_100g'] < 500;
                }

                return false;
            });

            return products;
        } else {
            console.warn('Brak produktów lub niepoprawny format odpowiedzi.');
            return [];
        }
    } catch (error) {
        console.error('Błąd przy pobieraniu produktów dietetycznych:', error);
        throw new Error('Nie udało się pobrać produktów dietetycznych');
    }
};


exports.getProductByBarcode = async (barcode) => {
    try {
        const response = await axios.get(
            `${process.env.OPENFOODFACTS_API_URL}/api/v3/product/${barcode}.json`,
            { timeout: 20000 }
        );
        return response.data.product || null;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return null;
        }
        console.error('Błąd przy pobieraniu szczegółów produktu:', error);
        throw new Error('Nie udało się pobrać szczegółów produktu');
    }
};