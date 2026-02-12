const openFoodFactsService = require('../services/openFoodFactsService');

exports.searchProducts = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Parametr "query" jest wymagany'
            });
        }

        const products = await openFoodFactsService.searchProducts(query);

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Błąd w kontrolerze searchProducts:', error);
        res.status(500).json({
            success: false,
            message: 'Błąd podczas pobierania wyników wyszukiwania',
            error: error.message
        });
    }
};

exports.getDietProducts = async (req, res) => {
    try {
        const { dietType } = req.query;

        if (!dietType) {
            return res.status(400).json({
                success: false,
                message: 'Parametr "dietType" jest wymagany'
            });
        }

        const validDietTypes = ['Utrata wagi', 'Przybieranie na wadze', 'Utrzymanie wagi'];
        if (!validDietTypes.includes(dietType)) {
            return res.status(400).json({
                success: false,
                message: 'Niepoprawny typ diety. Dozwolone wartości: Utrata wagi, Przybieranie na wadze, Utrzymanie wagi'
            });
        }

        const products = await openFoodFactsService.getDietProducts(dietType);

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Błąd w kontrolerze getDietProducts:', error);
        res.status(500).json({
            success: false,
            message: 'Błąd podczas pobierania produktów dietetycznych',
            error: error.message
        });
    }
};

exports.getProductByBarcode = async (req, res) => {
    try {
        const { barcode } = req.params;

        if (!barcode) {
            return res.status(400).json({
                success: false,
                message: 'Parametr "barcode" jest wymagany'
            });
        }

        const product = await openFoodFactsService.getProductByBarcode(barcode);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Nie znaleziono produktu'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Błąd w kontrolerze getProductByBarcode:', error);
        res.status(500).json({
            success: false,
            message: 'Błąd podczas pobierania szczegółów produktu',
            error: error.message
        });
    }
};