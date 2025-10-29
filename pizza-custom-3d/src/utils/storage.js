// src/utils/storage.js
const USERS_KEY = "pizza_app_users_v1";
const FEED_KEY = "pizza_app_feed_v1";
const USER_RECIPES_KEY_PREFIX = "pizza_user_recipes_";

export function loadUsersFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

export function saveUserToStorage(user) {
  const users = loadUsersFromStorage();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return user;
}

export function loadFeedFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(FEED_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

export function saveFeedToStorage(feed) {
  try {
    localStorage.setItem(FEED_KEY, JSON.stringify(feed || []));
  } catch (e) {}
}

export function saveRecipeToUser(userId, recipe) {
  try {
    const key = USER_RECIPES_KEY_PREFIX + userId;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.unshift({ id: Date.now(), ...recipe });
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (e) {}
}

export function loadRecipesForUser(userId) {
  try {
    const key = USER_RECIPES_KEY_PREFIX + userId;
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (e) {
    return [];
  }
}
