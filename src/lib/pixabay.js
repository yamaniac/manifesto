/**
 * Pixabay API service for fetching images
 */

const PIXABAY_API_KEY = process.env.PIXABAY_API || process.env.PIXABAY_API_KEY || process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
const PIXABAY_BASE_URL = 'https://pixabay.com/api/';

// Track used images to prevent duplicates
const usedImageIds = new Set();
const usedImageUrls = new Set();

/**
 * Fetch images from Pixabay based on search query
 * @param {string} query - Search query for images
 * @param {number} perPage - Number of images per page (default: 3)
 * @returns {Promise<Array>} Array of image objects
 */
export async function fetchImagesFromPixabay(query, perPage = 3) {
  if (!PIXABAY_API_KEY) {
    throw new Error('Pixabay API key not configured');
  }

  try {
    const searchQuery = encodeURIComponent(query);
    
    // Enhanced search parameters for better results
    const url = `${PIXABAY_BASE_URL}?key=${PIXABAY_API_KEY}&q=${searchQuery}&image_type=photo&orientation=horizontal&safesearch=true&per_page=${perPage}&min_width=800&min_height=600&order=popular`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.hits && data.hits.length > 0) {
      // Filter out low-quality, irrelevant, and duplicate images
      const filteredHits = data.hits.filter(hit => {
        // Check for duplicates
        if (usedImageIds.has(hit.id) || usedImageUrls.has(hit.webformatURL)) {
          return false;
        }
        
        // Prefer images with people/faces for personal affirmations, but not for wealth categories
        const tags = hit.tags.toLowerCase();
        const hasPerson = tags.includes('person') || tags.includes('people') || tags.includes('face') || tags.includes('portrait');
        const hasRelevantContent = tags.includes(query.toLowerCase().split(' ')[0]) || tags.includes(query.toLowerCase().split(' ')[1]);
        
        // Check if this is a wealth-related query
        const isWealthQuery = query.toLowerCase().includes('luxury') || query.toLowerCase().includes('wealth') || 
                             query.toLowerCase().includes('mansion') || query.toLowerCase().includes('expensive') ||
                             query.toLowerCase().includes('money') || query.toLowerCase().includes('lifestyle') ||
                             query.toLowerCase().includes('yacht') || query.toLowerCase().includes('jewelry');
        
        // Score based on relevance
        let score = 0;
        if (hasRelevantContent) score += 2; // Always prioritize relevant content
        
        // For wealth queries, don't prioritize people; for others, prioritize people
        if (!isWealthQuery && hasPerson) score += 2;
        if (isWealthQuery && !hasPerson) score += 1; // Slightly prefer non-person images for wealth
        
        if (hit.likes > 10) score += 1; // Popular images
        
        return score >= 2; // Only return images with decent relevance
      });
      
      // If filtering removed too many, fall back to original results but still filter duplicates
      let finalHits = filteredHits.length > 0 ? filteredHits : data.hits;
      
      // Remove duplicates from fallback results
      finalHits = finalHits.filter(hit => 
        !usedImageIds.has(hit.id) && !usedImageUrls.has(hit.webformatURL)
      );
      
      return finalHits.map(hit => ({
        id: hit.id,
        url: hit.webformatURL,
        preview_url: hit.previewURL,
        large_url: hit.largeImageURL,
        user: hit.user,
        tags: hit.tags,
        alt_text: `${query} - ${hit.tags}`,
        width: hit.webformatWidth,
        height: hit.webformatHeight,
        likes: hit.likes,
        downloads: hit.downloads
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching images from Pixabay:', error);
    throw error;
  }
}

/**
 * Get category-specific search terms for better image matching
 * @param {string} categoryName - Category name
 * @returns {string} Optimized search term
 */
export function getCategorySearchTerm(categoryName) {
  const categoryMappings = {
    // Personal Development & Mindset
    'motivation': 'achievement success goal reaching',
    'confidence': 'self-assured person professional',
    'courage': 'brave person determination',
    'strength': 'strong person resilience',
    'determination': 'focused person goal achievement',
    'ambition': 'driven person success career',
    'perseverance': 'persistent person overcoming',
    'discipline': 'organized person self-control',
    'focus': 'concentrated person clarity',
    'clarity': 'clear mind focused person',
    
    // Emotional Wellbeing
    'happiness': 'happy person smiling joy',
    'joy': 'joyful person celebration',
    'love': 'couple romance relationship',
    'gratitude': 'thankful person appreciation',
    'peace': 'calm person meditation',
    'calm': 'peaceful person serenity',
    'serenity': 'tranquil person peace',
    'contentment': 'satisfied person fulfillment',
    'fulfillment': 'accomplished person satisfaction',
    'harmony': 'balanced person peace',
    
    // Life Areas
    'health': 'fitness workout healthy lifestyle',
    'wellness': 'healthy person vitality',
    'fitness': 'athletic person exercise',
    'career': 'business professional office success',
    'business': 'professional person success',
    'relationships': 'friendship connection people',
    'friendship': 'friends together connection',
    'parenting': 'family children parent',
    'family': 'family together love',
    'marriage': 'couple wedding love',
    
    // Creative & Spiritual
    'creativity': 'artist creative work inspiration',
    'art': 'creative person artist',
    'inspiration': 'lightbulb idea innovation',
    'mindfulness': 'meditation zen calm',
    'meditation': 'meditation person zen',
    'spirituality': 'spiritual meditation peace',
    'faith': 'spiritual person belief',
    'growth': 'personal development progress achievement',
    'development': 'personal growth progress achievement',
    'transformation': 'personal change evolution growth',
    
    // Specific Positive States
    'empowerment': 'strong confident person determination',
    'success': 'achievement celebration person victory',
    'achievement': 'accomplishment celebration person',
    'balance': 'balanced person harmony lifestyle',
    'purpose': 'focused person direction meaning',
    'resilience': 'strong person overcoming challenge',
    'optimism': 'positive person hope future',
    'hope': 'hopeful person future optimism',
    'wisdom': 'wise person knowledge experience',
    'knowledge': 'educated person learning growth',
    
    // Additional Common Categories
    'abundance': 'luxury car mansion wealth lifestyle yacht jewelry',
    'prosperity': 'luxury mansion wealth lifestyle yacht jewelry',
    'wealth': 'luxury mansion expensive car money yacht jewelry',
    'money': 'luxury mansion expensive car wealth yacht jewelry',
    'freedom': 'liberated person independence joy',
    'independence': 'autonomous person freedom strength',
    'leadership': 'leader person guidance confidence',
    'guidance': 'mentor person leadership wisdom',
    'support': 'supportive person help community',
    'community': 'people together unity connection',
    'unity': 'people together connection harmony',
    'connection': 'people together relationship friendship'
  };
  
  const normalizedCategory = categoryName.toLowerCase().trim();
  
  // Try exact match first
  if (categoryMappings[normalizedCategory]) {
    return categoryMappings[normalizedCategory];
  }
  
  // Try partial matches for similar categories
  for (const [key, value] of Object.entries(categoryMappings)) {
    if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
      return value;
    }
  }
  
  // Smart fallback: analyze the category name and create relevant keywords
  const words = normalizedCategory.split(' ');
  const relevantTerms = [];
  
  // Always prioritize person-focused terms
  relevantTerms.push(`confident person ${normalizedCategory}`);
  relevantTerms.push(`${normalizedCategory} person`);
  relevantTerms.push(`person ${normalizedCategory}`);
  
  // Add positive achievement context
  relevantTerms.push(`achievement ${normalizedCategory}`);
  relevantTerms.push(`${normalizedCategory} success`);
  relevantTerms.push(`${normalizedCategory} positive`);
  
  // Add empowerment and growth context
  relevantTerms.push(`empowered ${normalizedCategory}`);
  relevantTerms.push(`growth ${normalizedCategory}`);
  
  // Return the most person-focused term
  return relevantTerms[0];
}

/**
 * Fetch a random image for a given category
 * @param {string} categoryName - Category name
 * @returns {Promise<Object|null>} Random image object or null
 */
export async function getRandomImageForCategory(categoryName) {
  try {
    // Check if we need to auto-reset duplicate tracking
    autoResetIfNeeded();
    
    const searchTerm = getCategorySearchTerm(categoryName);
    console.log(`Searching for images with term: "${searchTerm}" for category: "${categoryName}"`);
    
    // Try with larger page size to get more options
    let images = await fetchImagesFromPixabay(searchTerm, 30);
    
    if (images.length === 0) {
      // Try alternative search terms for the same category
      const alternativeTerms = getAlternativeSearchTerms(categoryName);
      for (const term of alternativeTerms) {
        console.log(`Trying alternative term: "${term}"`);
        const altImages = await fetchImagesFromPixabay(term, 20);
        if (altImages.length > 0) {
          console.log(`Found ${altImages.length} images with alternative term: "${term}"`);
          const randomIndex = Math.floor(Math.random() * altImages.length);
          const selectedImage = altImages[randomIndex];
          markImageAsUsed(selectedImage);
          return selectedImage;
        }
      }
      
      // Last resort: category-specific fallback search
      let fallbackTerm = 'confident person achievement';
      if (categoryName.toLowerCase().includes('abundance') || categoryName.toLowerCase().includes('prosperity') || categoryName.toLowerCase().includes('wealth') || categoryName.toLowerCase().includes('money')) {
        fallbackTerm = 'luxury mansion wealth lifestyle yacht jewelry';
      }
      console.log(`Trying fallback search: "${fallbackTerm}"`);
      const fallbackImages = await fetchImagesFromPixabay(fallbackTerm, 10);
      if (fallbackImages.length > 0) {
        const selectedImage = fallbackImages[0];
        markImageAsUsed(selectedImage);
        return selectedImage;
      }
      return null;
    }
    
    // If we have very few unique images left, try to expand the search
    if (images.length < 5) {
      console.log(`Only ${images.length} unique images available, expanding search...`);
      const expandedImages = await fetchImagesFromPixabay(searchTerm, 50);
      if (expandedImages.length > images.length) {
        images = expandedImages;
        console.log(`Expanded search found ${expandedImages.length} total images`);
      }
    }
    
    // Return a random image from the results
    const randomIndex = Math.floor(Math.random() * images.length);
    console.log(`Returning image ${randomIndex + 1} of ${images.length} found for "${searchTerm}"`);
    const selectedImage = images[randomIndex];
    markImageAsUsed(selectedImage);
    return selectedImage;
  } catch (error) {
    console.error('Error getting random image for category:', error);
    return null;
  }
}

/**
 * Mark an image as used to prevent duplicates
 * @param {Object} image - Image object
 */
function markImageAsUsed(image) {
  if (image && image.id) {
    usedImageIds.add(image.id);
    console.log(`Marked image ${image.id} as used to prevent duplicates`);
  }
  if (image && image.url) {
    usedImageUrls.add(image.url);
  }
}

/**
 * Get statistics about used images
 * @returns {Object} Statistics about duplicate prevention
 */
export function getDuplicatePreventionStats() {
  return {
    usedImageIds: usedImageIds.size,
    usedImageUrls: usedImageUrls.size,
    totalTracked: usedImageIds.size + usedImageUrls.size
  };
}

/**
 * Clear the duplicate tracking (useful for testing or resetting)
 */
export function clearDuplicateTracking() {
  usedImageIds.clear();
  usedImageUrls.clear();
  console.log('Cleared duplicate image tracking');
}

/**
 * Check if an image has been used before
 * @param {Object} image - Image object to check
 * @returns {boolean} True if image has been used before
 */
export function isImageDuplicate(image) {
  if (!image) return false;
  return usedImageIds.has(image.id) || usedImageUrls.has(image.url);
}

/**
 * Auto-reset duplicate tracking if we're running low on unique images
 * This prevents the system from getting stuck when most images have been used
 */
export function autoResetIfNeeded() {
  const stats = getDuplicatePreventionStats();
  
  // If we've tracked more than 1000 images, reset to free up memory
  if (stats.totalTracked > 1000) {
    console.log('Auto-resetting duplicate tracking (over 1000 images tracked)');
    clearDuplicateTracking();
    return true;
  }
  
  return false;
}

function getAlternativeSearchTerms(categoryName) {
  const alternatives = {
    // Personal Development
    'motivation': ['goal achievement', 'success celebration', 'determined person'],
    'confidence': ['self-assured', 'professional person', 'empowered woman'],
    'courage': ['brave person', 'determination', 'fearless'],
    'strength': ['strong person', 'resilience', 'powerful'],
    'determination': ['focused person', 'goal achievement', 'persistent'],
    'ambition': ['driven person', 'success career', 'aspiring'],
    'perseverance': ['persistent person', 'overcoming', 'resilient'],
    'discipline': ['organized person', 'self-control', 'focused'],
    'focus': ['concentrated person', 'clarity', 'attentive'],
    'clarity': ['clear mind', 'focused person', 'understanding'],
    
    // Emotional Wellbeing
    'happiness': ['joyful person', 'smiling face', 'happy celebration'],
    'joy': ['joyful person', 'celebration', 'happy'],
    'love': ['couple romance', 'relationship', 'affection'],
    'gratitude': ['thankful person', 'appreciation gesture', 'grateful'],
    'peace': ['calm person', 'meditation', 'serenity'],
    'calm': ['peaceful person', 'serenity', 'tranquil'],
    'serenity': ['tranquil person', 'peace', 'calm'],
    'contentment': ['satisfied person', 'fulfillment', 'happy'],
    'fulfillment': ['accomplished person', 'satisfaction', 'achievement'],
    'harmony': ['balanced person', 'peace', 'unity'],
    
    // Life Areas
    'health': ['fitness motivation', 'healthy lifestyle', 'wellness person'],
    'wellness': ['healthy person', 'vitality', 'wellbeing'],
    'fitness': ['athletic person', 'exercise', 'healthy'],
    'career': ['business success', 'professional achievement', 'office success'],
    'business': ['professional person', 'success', 'career'],
    'relationships': ['friendship connection', 'people together', 'supportive'],
    'friendship': ['friends together', 'connection', 'relationship'],
    'parenting': ['family children', 'parent', 'family'],
    'family': ['family together', 'love', 'parenting'],
    'marriage': ['couple wedding', 'love', 'relationship'],
    
    // Creative & Spiritual
    'creativity': ['creative person', 'artist inspiration', 'innovation'],
    'art': ['creative person', 'artist', 'inspiration'],
    'inspiration': ['lightbulb idea', 'innovation', 'creative'],
    'mindfulness': ['meditation person', 'calm person', 'zen practice'],
    'meditation': ['meditation person', 'zen', 'calm'],
    'spirituality': ['spiritual meditation', 'peace', 'faith'],
    'faith': ['spiritual person', 'belief', 'faith'],
    'growth': ['personal development', 'achievement progress', 'person growth'],
    'development': ['personal growth', 'achievement progress', 'person development'],
    'transformation': ['personal change', 'person evolution', 'growth achievement'],
    
    // Positive States
    'empowerment': ['confident person', 'strong determination', 'empowered person'],
    'success': ['achievement celebration', 'person victory', 'accomplishment'],
    'achievement': ['accomplishment celebration', 'person success', 'achievement'],
    'balance': ['balanced person', 'harmony lifestyle', 'person balance'],
    'purpose': ['focused person', 'direction meaning', 'person purpose'],
    'resilience': ['strong person', 'overcoming challenge', 'person resilience'],
    'optimism': ['positive person', 'hope future', 'person optimism'],
    'hope': ['hopeful person', 'future optimism', 'person hope'],
    'wisdom': ['wise person', 'knowledge experience', 'person wisdom'],
    'knowledge': ['educated person', 'learning growth', 'person knowledge'],
    
    // Additional Categories
    'abundance': ['luxury mansion', 'wealth lifestyle', 'expensive car', 'yacht', 'jewelry'],
    'prosperity': ['luxury mansion', 'wealth lifestyle', 'expensive car', 'yacht', 'jewelry'],
    'wealth': ['luxury mansion', 'expensive car', 'money lifestyle', 'yacht', 'jewelry'],
    'money': ['luxury mansion', 'expensive car', 'wealth lifestyle', 'yacht', 'jewelry'],
    'freedom': ['liberated person', 'independence joy', 'person freedom'],
    'independence': ['autonomous person', 'freedom strength', 'person independence'],
    'leadership': ['leader person', 'guidance confidence', 'person leadership'],
    'guidance': ['mentor person', 'leadership wisdom', 'person guidance'],
    'support': ['supportive person', 'help community', 'person support'],
    'community': ['people together', 'unity connection', 'person community'],
    'unity': ['people together', 'connection harmony', 'person unity'],
    'connection': ['people together', 'relationship friendship', 'person connection']
  };
  
  const normalizedCategory = categoryName.toLowerCase().trim();
  
  // Try exact match first
  if (alternatives[normalizedCategory]) {
    return alternatives[normalizedCategory];
  }
  
  // Try partial matches for similar categories
  for (const [key, value] of Object.entries(alternatives)) {
    if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
      return value;
    }
  }
  
  // Fallback: create relevant alternatives based on the category name
  return [
    `confident person ${normalizedCategory}`,
    `${normalizedCategory} person`,
    `achievement ${normalizedCategory}`,
    `${normalizedCategory} success`
  ];
}
