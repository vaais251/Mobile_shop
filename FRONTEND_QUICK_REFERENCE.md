# 🎯 Frontend Quick Reference - Multi-Image & Search Features

## 📸 Multi-Image Upload Implementation

### State Setup
```tsx
const [images, setImages] = useState<File[]>([]);
const [thumbnailIndex, setThumbnailIndex] = useState(0);
const [imagePreviews, setImagePreviews] = useState<string[]>([]);
```

### File Input Handler
```tsx
const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const filesArray = Array.from(e.target.files);
        setImages(filesArray);
        
        const previews = filesArray.map(file => URL.createObjectURL(file));
        setImagePreviews(previews);
        setThumbnailIndex(0);
    }
};
```

### UI - File Input
```tsx
<input
    type="file"
    accept="image/*"
    multiple
    onChange={handleFilesChange}
    className="hidden"
    id="image-upload"
/>
<label htmlFor="image-upload">
    <Button type="button" variant="outline">
        Upload Photos
    </Button>
</label>
```

### UI - Preview Grid with Thumbnail Selection
```tsx
{imagePreviews.length > 0 && (
    <div className="grid grid-cols-3 gap-4 mt-4">
        {imagePreviews.map((preview, index) => (
            <div
                key={index}
                onClick={() => setThumbnailIndex(index)}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    thumbnailIndex === index
                        ? 'border-emerald-500 border-4 scale-105'
                        : 'border-border hover:border-primary/50'
                }`}
            >
                <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover"
                />
                {thumbnailIndex === index && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-lg">
                        Cover
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-1 text-xs">
                    Photo {index + 1}
                </div>
            </div>
        ))}
    </div>
)}
```

### Form Submission
```tsx
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('brand', formData.brand);
    data.append('model', formData.model);
    // ... other fields ...
    
    // Add all images
    images.forEach(image => {
        data.append('images', image);  // Same field name!
    });
    
    // Add thumbnail index
    data.append('thumbnail_index', thumbnailIndex.toString());
    
    const response = await api.post('/phones/sell', data, token);
    // ...
};
```

---

## 🖼️ Product Gallery Implementation

### State & Image Parsing
```tsx
const [currentImageIndex, setCurrentImageIndex] = useState(0);

// Parse images from backend JSON
const getImages = () => {
    if (phone.images) {
        try {
            return JSON.parse(phone.images) as string[];
        } catch {
            return [phone.thumbnail || '/placeholder.jpg'];
        }
    }
    return [phone.thumbnail || '/placeholder.jpg'];
};

const images = getImages();
const currentImage = images[currentImageIndex] || images[0];
```

### UI - Main Image Display
```tsx
<div className="relative w-full aspect-square bg-muted rounded-xl overflow-hidden">
    <img
        src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}${currentImage}`}
        alt={phone.model}
        className="w-full h-full object-contain"
    />
</div>
```

### UI - Thumbnail Navigation
```tsx
{images.length > 1 && (
    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
        {images.map((img, index) => (
            <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    currentImageIndex === index
                        ? 'border-primary border-4 scale-110'
                        : 'border-border hover:border-primary/50'
                }`}
            >
                <img
                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}${img}`}
                    alt={`View ${index + 1}`}
                    className="w-full h-full object-cover"
                />
            </button>
        ))}
    </div>
)}
```

---

## 🔍 Search & Filter Implementation

### State Setup
```tsx
const [searchQuery, setSearchQuery] = useState('');
const [selectedColor, setSelectedColor] = useState('');
```

### Fetch Function with Filters
```tsx
const fetchPhones = async () => {
    setLoading(true);
    try {
        let url = '/phones/shop?';
        
        if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
        if (selectedColor) url += `color=${encodeURIComponent(selectedColor)}&`;
        if (filters.brand) url += `brand=${filters.brand}&`;
        // ... other filters ...
        
        const response = await api.get<{ items: PhoneInventory[] }>(url);
        if (response.data) {
            setPhones(response.data.items);
        }
    } catch (error) {
        console.error('Error fetching phones:', error);
    } finally {
        setLoading(false);
    }
};

// Trigger on mount and when filters change
useEffect(() => {
    fetchPhones();
}, [searchQuery, selectedColor, filters.brand]);  // Re-fetch when these change
```

### UI - Search Bar
```tsx
<div className="flex gap-3 mb-6">
    <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
            type="search"
            placeholder="Search by iPhone X,  Samsung S21..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPhones()}
            className="pl-10 bg-background border-input"
        />
    </div>
    
    <Select value={selectedColor} onValueChange={setSelectedColor}>
        <SelectTrigger className="w-40 bg-background border-input">
            <SelectValue placeholder="Color" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="">All Colors</SelectItem>
            <SelectItem value="Black">Black</SelectItem>
            <SelectItem value="White">White</SelectItem>
            <SelectItem value="Gold">Gold</SelectItem>
            <SelectItem value="Blue">Blue</SelectItem>
            <SelectItem value="Silver">Silver</SelectItem>
            <SelectItem value="Red">Red</SelectItem>
            <SelectItem value="Green">Green</SelectItem>
        </SelectContent>
    </Select>
    
    <Button 
        onClick={fetchPhones}
        className="px-6"
    >
        Search
    </Button>
    
    {(searchQuery || selectedColor) && (
        <Button
            variant="outline"
            onClick={() => {
                setSearchQuery('');
                setSelectedColor('');
            }}
        >
            Clear
        </Button>
    )}
</div>
```

### Don't Forget Imports!
```tsx
import { Search } from 'lucide-react';
```

---

## ℹ️ Condition Guide Tooltip

### Simple Hover Tooltip
```tsx
import { Info } from 'lucide-react';

<Label className="flex items-center gap-2">
    Condition Grade *
    <div className="group relative">
        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 bg-popover border border-border rounded-lg p-3 text-xs shadow-xl z-50">
            <p className="font-semibold mb-2 text-foreground">Grading Guide:</p>
            <ul className="space-y-1 text-muted-foreground">
                <li>• <span className="font-medium text-foreground">10/10:</span> Like New, mint condition</li>
                <li>• <span className="font-medium text-foreground">9/10:</span> Excellent, minor scratches</li>
                <li>• <span className="font-medium text-foreground">8/10:</span> Good, light wear</li>
                <li>• <span className="font-medium text-foreground">7/10:</span> Visible dents/dots</li>
                <li>• <span className="font-medium text-foreground">&lt;7:</span> Cracked or major issues</li>
            </ul>
        </div>
    </div>
</Label>
```

---

## 🎨 Theme-Aware Styling Tips

### Always Use Theme Variables
```tsx
// ❌ DON'T
className="bg-white text-black border-gray-300"

// ✅ DO
className="bg-background text-foreground border-border"

// ✅ PERFECT (for cards)
className="bg-card text-card-foreground border-border"
```

### Common Theme Classes
- **Background:** `bg-background`
- **Card:** `bg-card`
- **Text:** `text-foreground`, `text-muted-foreground`
- **Border:** `border-border`
- **Primary:** `bg-primary text-primary-foreground`
- **Muted Areas:** `bg-muted text-muted-foreground`
- **Inputs:** `bg-background border-input`
- **Popover:** `bg-popover text-popover-foreground`

---

## 🔧 Common Pitfalls & Solutions

### ❌ Pitfall: FormData with Array
```tsx
// WRONG - Creates separate fields
data.append('images[]', image1);
data.append('images[]', image2);
```

### ✅ Solution
```tsx
// CORRECT - FastAPI handles this automatically
images.forEach(image => {
    data.append('images', image);  // Same name!
});
```

### ❌ Pitfall: Forgetting to Parse JSON
```tsx
// WRONG
<img src={phone.images} />  // Shows JSON string!
```

### ✅ Solution
```tsx
// CORRECT
const images = JSON.parse(phone.images);
<img src={images[0]} />
```

### ❌ Pitfall: Missing Backend URL
```tsx
// WRONG - Relative path
<img src="/static/images/abc.jpg" />  // 404 on localhost:3000
```

### ✅ Solution
```tsx
// CORRECT - Absolute path
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
<img src={`${BACKEND_URL}/static/images/abc.jpg`} />
```

---

## 📋 Checklist Before Testing

- [ ] Import all necessary icons (`Search`, `Info`, etc.)
- [ ] Add `multiple` attribute to file input
- [ ] Use same field name (`images`) for all files in FormData
- [ ] Parse `images` field as JSON in product gallery
- [ ] Add `BACKEND_URL` to image paths
- [ ] Use theme-aware classes (no hardcoded colors)
- [ ] Test in both light and dark modes
- [ ] Clear URL objects after unmounting to prevent memory leaks

---

## 🚀 Ready to Code!

Start with **Multi-Image Upload** on the sell page, then move to **Product Gallery**, and finally add **Search & Filter UI**.

Good luck! 🎉
