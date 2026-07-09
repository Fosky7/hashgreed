import React, { useState, useEffect, useContext } from 'react';
import { Restaurant } from '../types/Restaurant';
import { MenuItem as MenuItemType } from '../types/MenuItem';
import { CartContext } from '../hooks/useCart';
import { useParams } from 'react-router-dom';

// Import images for menu items
import jollofRiceChicken from '../assets/jollof-rice-chicken.png';
import friedRiceTurkey from '../assets/fried-rice-turkey.png';
import jollofRiceFish from '../assets/jollof-rice-fish.png';
import beefSuya from '../assets/beef-suya.png';
import chickenSuya from '../assets/chicken-suya.png';
import ramSuya from '../assets/ram-suya.png';
import efoRiro from '../assets/efo-riro.png';
import egusiSoup from '../assets/egusi-soup.png';
import okroSoup from '../assets/okro-soup.png';
import amalaAndEwedu from '../assets/amala-ewedu.png';
import amalaAndGbegiri from '../assets/amala-gbegiri.png';
import catfishPepperSoup from '../assets/catfish-pepper-soup.png';
import goatMeatPepperSoup from '../assets/goat-meat-pepper-soup.png';
import abacha from '../assets/abacha.png';
import akpuOha from '../assets/akpu-oha.png';

// Import images for restaurant logos on the restaurant page
import jollofSpotLogo from '../assets/jollof-spot.png';
import suyaKingLogo from '../assets/suya-king.png';
import poundedYamPalaceLogo from '../assets/pounded-yam-palace.png';
import amalaConnectLogo from '../assets/amala-connect.png';
import pepperSoupHubLogo from '../assets/pepper-soup-hub.png';
import mamaPutKitchenLogo from '../assets/mama-put-kitchen.png';

// Function to simulate fetching menu items for a given restaurant ID
const getRestaurantMenu = (restaurantId: string): MenuItemType[] => {
  switch (restaurantId) {
    case '1': // Jollof Spot
      return [
        { id: 'm1-1', name: 'Jollof Rice with Chicken', description: 'Classic Nigerian jollof rice served with grilled chicken.', price: 2500, imageUrl: jollofRiceChicken },
        { id: 'm1-2', name: 'Fried Rice with Turkey', description: 'Savory fried rice with tender turkey pieces.', price: 2800, imageUrl: friedRiceTurkey },
        { id: 'm1-3', name: 'Jollof Rice with Fish', description: 'Classic Nigerian jollof rice served with grilled fish.', price: 2700, imageUrl: jollofRiceFish },
      ];
    case '2': // Suya King
      return [
        { id: 'm2-1', name: 'Beef Suya', description: 'Grilled skewered beef marinated in a spicy peanut blend.', price: 3500, imageUrl: beefSuya },
        { id: 'm2-2', name: 'Chicken Suya', description: 'Grilled skewered chicken marinated in a spicy peanut blend.', price: 3000, imageUrl: chickenSuya },
        { id: 'm2-3', name: 'Ram Suya', description: 'Grilled skewered ram marinated in a spicy peanut blend.', price: 4000, imageUrl: ramSuya },
      ];
    case '3': // Pounded Yam Palace
      return [
        { id: 'm3-1', name: 'Efo Riro with Pounded Yam', description: 'Traditional Yoruba vegetable soup, served with pounded yam.', price: 3200, imageUrl: efoRiro },
        { id: 'm3-2', name: 'Egusi Soup with Pounded Yam', description: 'Delicious melon seed soup with various meats, served with pounded yam.', price: 3000, imageUrl: egusiSoup },
        { id: 'm3-3', name: 'Okro Soup with Pounded Yam', description: 'Bland okro soup served with pounded yam.', price: 3000, imageUrl: okroSoup },
      ];
    case '4': // Amala Connect
      return [
        { id: 'm4-1', name: 'Amala and Ewedu', description: 'Dark yam flour swallow served with jute leaf soup and gbegiri.', price: 2700, imageUrl: amalaAndEwedu },
        { id: 'm4-2', name: 'Amala and Gbegiri', description: 'Dark yam flour swallow served with bean soup.', price: 2500, imageUrl: amalaAndGbegiri },
      ];
    case '5': // Pepper Soup Hub
      return [
        { id: 'm5-1', name: 'Catfish Pepper Soup', description: 'Spicy and flavorful catfish soup.', price: 4000, imageUrl: catfishPepperSoup },
        { id: 'm5-2', name: 'Goat Meat Pepper Soup', description: 'Hot and spicy goat meat soup.', price: 3800, imageUrl: goatMeatPepperSoup },
      ];
    case '6': // Mama Put Kitchen
      return [
        { id: 'm6-1', name: 'Abacha (African Salad)', description: 'Traditional African salad made with cassava flakes.', price: 2000, imageUrl: abacha },
        { id: 'm6-2', name: 'Akpu and Oha Soup', description: 'Fermented cassava meal served with Oha soup.', price: 3000, imageUrl: akpuOha },
      ];
    default:
      return [];
  }
};

// Shared heading scale to match HomePage.
const sectionHeadingClasses =
  'text-2xl sm:text-3xl font-bold tracking-tight text-gray-900';

const RestaurantPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        // Simulate API call for restaurant details
        await new Promise((resolve) => setTimeout(resolve, 500));

        const allRestaurants: Restaurant[] = [
          { id: '1', name: 'Jollof Spot', cuisine: 'Nigerian', imageUrl: jollofSpotLogo, rating: 4.5, deliveryTime: 30 },
          { id: '2', name: 'Suya King', cuisine: 'Suya', imageUrl: suyaKingLogo, rating: 4.8, deliveryTime: 25 },
          { id: '3', name: 'Pounded Yam Palace', cuisine: 'Nigerian', imageUrl: poundedYamPalaceLogo, rating: 4.2, deliveryTime: 35 },
          { id: '4', name: 'Amala Connect', cuisine: 'Nigerian', imageUrl: amalaConnectLogo, rating: 4.0, deliveryTime: 40 },
          { id: '5', name: 'Pepper Soup Hub', cuisine: 'Nigerian', imageUrl: pepperSoupHubLogo, rating: 4.7, deliveryTime: 20 },
          { id: '6', name: 'Mama Put Kitchen', cuisine: 'Nigerian', imageUrl: mamaPutKitchenLogo, rating: 4.3, deliveryTime: 30 },
        ];

        const foundRestaurant = allRestaurants.find((r) => r.id === id);
        if (foundRestaurant) {
          setRestaurant(foundRestaurant);
          setMenu(getRestaurantMenu(foundRestaurant.id)); // Get specific menu for the restaurant
        } else {
          setError('Restaurant not found.');
        }
      } catch (err) {
        setError('Failed to fetch restaurant details.');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantDetails();
  }, [id]);

  if (loading) {
    return <p className="py-8 text-center text-base text-gray-500">Loading restaurant details...</p>;
  }

  if (error) {
    return <p className="py-8 text-center text-base font-medium text-red-600">Error: {error}</p>;
  }

  if (!restaurant) {
    return null; // Should not happen if error is handled
  }

  return (
    <div>
      {/* Hero card */}
      <div className="mb-10 overflow-hidden rounded-2xl bg-white shadow-card">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="h-64 w-full object-cover"
        />
        <div className="p-6">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">{restaurant.name}</h1>
          <p className="mb-4 text-base text-gray-500">{restaurant.cuisine} Cuisine</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-600">
            <span className="flex items-center text-base font-medium">
              <svg className="mr-1.5 h-5 w-5 fill-current text-primary-500" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 15l-4.3 2.7 1.2-5.1-3.9-3.3 5.2-.4 2.1-5.2 2.1 5.2 5.2.4-3.9 3.3 1.2 5.1z" />
              </svg>
              {restaurant.rating}
            </span>
            <span className="text-base font-medium text-gray-600">{restaurant.deliveryTime} min delivery</span>
          </div>
        </div>
      </div>

      {/* Menu */}
      <h2 className={`${sectionHeadingClasses} mb-6`}>Menu</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menu.map((item) => (
          <div
            key={item.id}
            className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-shadow duration-300 ease-in-out hover:shadow-lg"
          >
            <img src={item.imageUrl} alt={item.name} className="h-48 w-full object-cover" />
            <div className="flex flex-1 flex-col p-5">
              <h3 className="mb-1.5 text-lg font-semibold text-gray-900">{item.name}</h3>
              <p className="mb-4 text-sm leading-relaxed text-gray-600">{item.description}</p>
              <p className="mt-auto text-lg font-bold text-primary-700">
                ₦{item.price.toLocaleString()}
              </p>
              <button
                onClick={() => addToCart(item)}
                className="mt-4 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantPage;
