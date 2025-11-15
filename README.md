# NCAA Men's Basketball Data Explorer

A React + TypeScript + Vite application for exploring NCAA Men's Basketball data with powerful filtering, search, and export capabilities.

## Features

- 🏀 **Three Data Views**: Teams, Players, and Transfers
- 🔍 **Advanced Search**: Autocomplete suggestions as you type
- 🎛️ **Flexible Filters**: Filter by string, number, date, or categorical values
- 📊 **Column Selection**: Show/hide columns dynamically
- 📥 **Export Options**: Download filtered data as CSV or XLSX
- 🎨 **IU Theming**: Indiana University crimson and cream color scheme
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Place your Excel file:**
   - Copy your Excel file `NCAA Mens basketball Data (2).xlsx` to `public/data/`
   - The file should contain sheets named "Teams", "Players", and "Transfers"
   - If your sheet names differ, the app will try to match them automatically

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Navigate to `http://localhost:5173` (or the port shown in the terminal)

## Project Structure

```
src/
├── components/          # React components
│   ├── DataExplorer.tsx # Main data exploration component
│   ├── DataTable.tsx    # Data table with pagination
│   ├── FiltersPanel.tsx # Column selection and filters
│   ├── Header.tsx       # Top navigation bar
│   ├── Home.tsx         # Home page with navigation cards
│   └── SearchBar.tsx    # Search input with autocomplete
├── config/
│   └── columns.ts       # Column definitions for each dataset
├── context/
│   └── DataContext.tsx  # Global data state management
└── utils/
    ├── download.ts      # CSV/XLSX export utilities
    ├── filters.ts       # Filtering logic
    └── loadData.ts      # Excel file loading

public/
└── data/
    └── NCAA Mens basketball Data (2).xlsx  # Your Excel file goes here
```

## Usage

### Home Page
- Click on one of the three cards (Team Data, Player Data, Transfer Data) to navigate to that dataset

### Data Explorer
- **Search**: Type in the search bar to find matching records across searchable columns
- **Column Selection**: Use checkboxes in the filters panel to show/hide columns
- **Filters**: 
  - String columns: Text input for "contains" filtering
  - Number columns: Min/Max range inputs
  - Date columns: From/To date pickers
  - Categorical columns: Multi-select checkboxes (if ≤20 unique values) or text input
- **Pagination**: Navigate through large datasets using Previous/Next buttons
- **Export**: Download the currently filtered data as CSV or XLSX

## Customization

### Column Configuration
Edit `src/config/columns.ts` to customize:
- Column labels
- Column types (string, number, date, categorical)
- Which columns are searchable
- Which columns are filterable
- Default visible columns

### Theming
The app uses Tailwind CSS with IU colors defined in `tailwind.config.js`:
- Primary (Crimson): `#990000`
- Background (Cream): `#EDEBEB`
- Text: `#191919`

## Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **SheetJS (xlsx)** - Excel file parsing and generation

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## License

MIT
