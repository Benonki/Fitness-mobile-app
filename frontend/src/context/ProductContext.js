import React, {createContext, useState, useEffect, useContext, useRef, useCallback} from 'react';
import { UserContext } from './UserContext';
import { loadProductsFromAPI, updateUserProducts } from '../api/eatedProducts';
import { useNotifications } from "./NotificationContext";
import { setNotificationFlag } from "../api/notifications";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const { user, setUser } = useContext(UserContext);
  const [products, setProducts] = useState([]);
  const [lastDate, setLastDate] = useState(null);
  const [maxCalories, setMaxCalories] = useState(0);
  const prevUserId = useRef(null);
  const prevEatenProducts = useRef(null);
  const { addUserNotification } = useNotifications();

  const loadProducts = async () => {
    if (!user) return;

    try {
      const today = new Date().toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      setLastDate(today);
      const userData = await loadProductsFromAPI(user.id);
      setProducts(userData.eatenProducts || []);
    } catch (error) {
      console.error('Błąd podczas ładowania produktów:', error);
    }
  };

  const addProduct = async (product) => {
    if (!user) return;
    if (!product || product.calories === 0) {
      console.error('Produkt ma nieprawidłowe lub puste dane');
      return;
    }

    const productWithDefaults = {
      name: product.name || '',
      calories: product.calories || 0,
      fat: product.fat || null,
      sugar: product.sugar || null,
      proteins: product.proteins || null,
    };
    try {
      const userData = await loadProductsFromAPI(user.id);
      const updatedProducts = userData.eatenProducts
          ? [...userData.eatenProducts, productWithDefaults]
          : [productWithDefaults];
      await updateUserProducts(user.id, updatedProducts);
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Błąd podczas dodawania produktu:', error);
    }
  };


  const removeProduct = async (productIndex) => {
    if (!user) return;

    try {
      const userData = await loadProductsFromAPI(user.id);
      const updatedProducts = userData.eatenProducts.filter((_, index) => index !== productIndex);
      await updateUserProducts(user.id, updatedProducts);
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Błąd podczas usuwania produktu:', error);
    }
  };

  const getTotalNutrients = () => {
    return products.reduce(
        (totals, product) => {
          return {
            calories: totals.calories + (parseFloat(product.calories) || 0),
            fat: totals.fat + (parseFloat(product.fat) || 0),
            sugar: totals.sugar + (parseFloat(product.sugar) || 0),
            proteins: totals.proteins + (parseFloat(product.proteins) || 0),
          };
        },
        { calories: 0, fat: 0, sugar: 0, proteins: 0 }
    );
  };

  useEffect(() => {
    if (!user) {
      setProducts([]);
      return;
    }

    if (user.id === prevUserId.current && JSON.stringify(user.eatenProducts) === JSON.stringify(prevEatenProducts.current)) {
      return;
    }

    prevUserId.current = user.id;
    prevEatenProducts.current = user.eatenProducts;

    loadProducts();
  }, [user?.id, user?.eatenProducts]);

  const calculateMaxCalories = useCallback((userData) => {
    if (!userData) return 0;

    const age = new Date().getFullYear() - parseInt(userData.dateOfBirth.slice(-4));
    let calories = 0;

    if (userData.gender === "Mężczyzna") {
      calories = 66.47 + (13.75 * userData.weight) + (5.003 * userData.height) - (6.755 * age);
    } else {
      calories = 665.1 + (9.563 * userData.weight) + (1.85 * userData.height) - (4.676 * age);
    }

    switch (userData.exercises) {
      case 0: calories *= 1.4; break;
      case 1: calories *= 1.55; break;
      case 2: calories *= 1.7; break;
      case 3: calories *= 1.85; break;
      case 4: calories *= 2.0; break;
      case 5: calories *= 2.2; break;
      default: calories *= 2.4; break;
    }

    switch (userData.objective) {
      case "Utrata wagi": return Math.floor(calories - 300);
      case "Przybieranie na wadze": return Math.floor(calories + 300);
      case "Utrzymanie wagi": return Math.floor(calories);
      default: return 2000;
    }
  }, []);

  useEffect(() => {
    if (user) {
      setMaxCalories(calculateMaxCalories(user));
    }
  }, [user, calculateMaxCalories]);

  useEffect(() => {
    if (!user || maxCalories === 0) return;

    const checkCaloriesGoal = async () => {
      const totalCalories = getTotalNutrients().calories;

      if (totalCalories >= maxCalories && !user.notificationFlags?.caloriesGoalSent) {
        try {
          const caloriesNotification = {
            id: new Date().getTime(),
            title: "Gratulacje! 😀",
            message: "Osiągnąłeś swój cel kalorii 🍕!!!"
          };
          addUserNotification(user.id, caloriesNotification);
          setUser({
            ...user,
            notificationFlags: {
              ...user.notificationFlags,
              caloriesGoalSent: true
            }
          });
          await setNotificationFlag(user.id, 'caloriesGoalSent', true);
        } catch (error) {
          console.error('Błąd podczas wysyłania powiadomienia o celu kalorii:', error);
        }
      }
    };

    checkCaloriesGoal();
  }, [user, maxCalories, getTotalNutrients, addUserNotification, setUser, products]);

  return (
      <ProductContext.Provider
          value={{products, addProduct, removeProduct, getTotalNutrients, lastDate, maxCalories}}>
        {children}
      </ProductContext.Provider>
  );
};