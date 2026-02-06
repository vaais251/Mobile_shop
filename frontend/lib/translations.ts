/**
 * Translation dictionary for English and Urdu
 */

export type Language = 'en' | 'ur';

export interface Translations {
    // Navigation
    nav_shop: string;
    nav_community: string;
    nav_sell: string;
    nav_login: string;
    nav_logout: string;
    nav_profile: string;
    nav_my_listings: string;

    // Hero Section
    hero_title: string;
    hero_subtitle: string;
    hero_cta: string;

    // Product
    condition: string;
    price: string;
    buy_now: string;
    view_details: string;
    sold: string;
    featured: string;
    pending_approval: string;
    approved: string;
    defects: string;
    no_defects: string;
    battery_health: string;
    storage: string;
    warranty: string;
    accessories: string;
    seller: string;
    verified_seller: string;
    shop_owned: string;
    add_to_cart: string;
    in_cart: string;

    // Sell Form
    sell_your_phone: string;
    sell_form_title: string;
    sell_form_subtitle: string;
    brand: string;
    model: string;
    color: string;
    select_brand: string;
    select_condition: string;
    enter_model: string;
    enter_price: string;
    enter_defects: string;
    condition_placeholder: string;
    submit_listing: string;
    listing_success: string;
    listing_pending: string;

    // Filters
    filter_by: string;
    all_brands: string;
    min_price: string;
    max_price: string;
    min_condition: string;
    apply_filters: string;
    clear_filters: string;

    // Auth
    login: string;
    signup: string;
    email: string;
    password: string;
    name: string;
    phone_number: string;
    login_success: string;
    signup_success: string;
    login_required: string;

    // Misc
    loading: string;
    error: string;
    no_phones_found: string;
    welcome_message: string;
    language: string;
    months: string;
}

export const translations: Record<Language, Translations> = {
    en: {
        // Navigation
        nav_shop: 'Shop',
        nav_community: 'Community',
        nav_sell: 'Sell',
        nav_login: 'Login',
        nav_logout: 'Logout',
        nav_profile: 'Profile',
        nav_my_listings: 'My Listings',

        // Hero Section
        hero_title: 'Premium Second-Hand Phones',
        hero_subtitle: 'Certified quality, unbeatable prices. Every phone inspected and graded.',
        hero_cta: 'Browse Collection',

        // Product
        condition: 'Condition',
        price: 'Price',
        buy_now: 'Buy Now',
        view_details: 'View Details',
        sold: 'Sold',
        featured: 'Featured',
        pending_approval: 'Pending Approval',
        approved: 'Approved',
        defects: 'Defects',
        no_defects: 'No defects - Perfect condition',
        battery_health: 'Battery Health',
        storage: 'Storage',
        warranty: 'Warranty',
        accessories: 'Accessories',
        seller: 'Seller',
        verified_seller: 'Verified Seller',
        shop_owned: 'Shop Owned',
        add_to_cart: 'Add to Cart',
        in_cart: 'In Cart',

        // Sell Form
        sell_your_phone: 'Sell Your Phone',
        sell_form_title: 'List Your Phone',
        sell_form_subtitle: 'Fill in the details below to list your phone for sale',
        brand: 'Brand',
        model: 'Model',
        color: 'Color',
        select_brand: 'Select brand',
        select_condition: 'Select condition',
        enter_model: 'Enter model name',
        enter_price: 'Enter price in PKR',
        enter_defects: 'Describe any defects (optional)',
        condition_placeholder: 'e.g., 9.5',
        submit_listing: 'Submit Listing',
        listing_success: 'Listing Submitted!',
        listing_pending: 'Your listing is pending Admin approval.',

        // Filters
        filter_by: 'Filter By',
        all_brands: 'All Brands',
        min_price: 'Min Price',
        max_price: 'Max Price',
        min_condition: 'Min Condition',
        apply_filters: 'Apply Filters',
        clear_filters: 'Clear',

        // Auth
        login: 'Login',
        signup: 'Sign Up',
        email: 'Email',
        password: 'Password',
        name: 'Full Name',
        phone_number: 'Phone Number',
        login_success: 'Login successful!',
        signup_success: 'Account created successfully!',
        login_required: 'Please login to continue',

        // Misc
        loading: 'Loading...',
        error: 'An error occurred',
        no_phones_found: 'No phones found',
        welcome_message: 'Welcome to Skardu Mobile',
        language: 'Language',
        months: 'months',
    },
    ur: {
        // Navigation
        nav_shop: 'دکان',
        nav_community: 'کمیونٹی',
        nav_sell: 'بیچیں',
        nav_login: 'لاگ ان',
        nav_logout: 'لاگ آؤٹ',
        nav_profile: 'پروفائل',
        nav_my_listings: 'میری فہرستیں',

        // Hero Section
        hero_title: 'پریمیم سیکنڈ ہینڈ فونز',
        hero_subtitle: 'تصدیق شدہ معیار، بہترین قیمتیں۔ ہر فون کا معائنہ اور درجہ بندی۔',
        hero_cta: 'کلیکشن دیکھیں',

        // Product
        condition: 'حالت',
        price: 'قیمت',
        buy_now: 'ابھی خریدیں',
        view_details: 'تفصیلات دیکھیں',
        sold: 'فروخت ہوا',
        featured: 'نمایاں',
        pending_approval: 'منظوری کے منتظر',
        approved: 'منظور شدہ',
        defects: 'خرابیاں',
        no_defects: 'کوئی خرابی نہیں - بالکل ٹھیک',
        battery_health: 'بیٹری ہیلتھ',
        storage: 'اسٹوریج',
        warranty: 'وارنٹی',
        accessories: 'لوازمات',
        seller: 'فروخت کنندہ',
        verified_seller: 'تصدیق شدہ',
        shop_owned: 'دکان کی ملکیت',
        add_to_cart: 'کارٹ میں شامل کریں',
        in_cart: 'کارٹ میں موجود ہے',

        // Sell Form
        sell_your_phone: 'اپنا فون بیچیں',
        sell_form_title: 'اپنا فون لسٹ کریں',
        sell_form_subtitle: 'فون فروخت کے لیے نیچے تفصیلات بھریں',
        brand: 'برانڈ',
        model: 'ماڈل',
        color: 'رنگ',
        select_brand: 'برانڈ منتخب کریں',
        select_condition: 'حالت منتخب کریں',
        enter_model: 'ماڈل کا نام درج کریں',
        enter_price: 'قیمت PKR میں درج کریں',
        enter_defects: 'کوئی خرابی بیان کریں (اختیاری)',
        condition_placeholder: 'مثلاً 9.5',
        submit_listing: 'فہرست جمع کروائیں',
        listing_success: 'فہرست جمع ہو گئی!',
        listing_pending: 'آپ کی فہرست ایڈمن کی منظوری کے منتظر ہے۔',

        // Filters
        filter_by: 'فلٹر کریں',
        all_brands: 'تمام برانڈز',
        min_price: 'کم سے کم قیمت',
        max_price: 'زیادہ سے زیادہ قیمت',
        min_condition: 'کم سے کم حالت',
        apply_filters: 'فلٹر لگائیں',
        clear_filters: 'صاف کریں',

        // Auth
        login: 'لاگ ان',
        signup: 'سائن اپ',
        email: 'ای میل',
        password: 'پاسورڈ',
        name: 'پورا نام',
        phone_number: 'فون نمبر',
        login_success: 'لاگ ان کامیاب!',
        signup_success: 'اکاؤنٹ کامیابی سے بن گیا!',
        login_required: 'جاری رکھنے کے لیے لاگ ان کریں',

        // Misc
        loading: 'لوڈ ہو رہا ہے...',
        error: 'ایک خرابی پیش آئی',
        no_phones_found: 'کوئی فون نہیں ملا',
        welcome_message: 'سکردو موبائل میں خوش آمدید',
        language: 'زبان',
        months: 'مہینے',
    },
};
