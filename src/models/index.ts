import { sequelize } from '../config/database';

// Import models
import { Group } from './Group';
import { MusicGenre } from './MusicGenre';
import User from './User';
import { Order } from './Order';
import { OrderDetail } from './OrderDetail';
import Cart from './Cart';
import { CartDetail } from './CartDetail';
import { Record } from './Record';

// Import model setup functions
import { setupGroupAssociations } from './Group';
import { setupMusicGenreAssociations } from './MusicGenre';
import { setupUserAssociations } from './User';
import { setupAssociations as setupOrderAssociations } from './associations';

// Re-export all models and types
export { Group, MusicGenre, Order, OrderDetail, CartDetail, Record };
export { default as Cart } from './Cart';
export { default as User } from './User';
export type { IUserAttributes, UserCreationAttributes } from './User';

// Setup all associations in the correct order
export function setupAssociations() {
    // First, setup associations that don't depend on other models
    setupMusicGenreAssociations();
    setupGroupAssociations();
    
    // Then setup user associations
    setupUserAssociations();
    
    // Finally, setup order and cart associations
    setupOrderAssociations();
    
    console.log('All model associations have been set up');
}

// Export the sequelize instance to be used throughout the application
export { sequelize };
