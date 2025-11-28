# 🏀 IU Data Hub - NCAA Men's Basketball Data Explorer

> A comprehensive, interactive web application for exploring and analyzing NCAA Men's Basketball data, built by the Sports Innovation Institute at Indiana University.

[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-purple.svg)](https://vitejs.dev/)

---

## ✨ Features

### 📊 **Interactive Dashboard**
- **High-level Overview**: Get instant insights with total players, teams, and transfers statistics
- **Top 10 Rankings**: Discover top performers across multiple categories (points, assists, rebounds, etc.)
- **Season-based Analysis**: Filter dashboard metrics by season or view all-season averages
- **Visual Charts**: Beautiful bar charts powered by Recharts for data visualization

### 👤 **Player Stats & Profiles**
- **Comprehensive Player Database**: Browse through thousands of player records with detailed statistics
- **Player Profile Pages**: Deep dive into individual player performance with:
  - Season-by-season statistics breakdown
  - Interactive line graphs tracking performance over time
  - Transfer history with detailed transfer records
  - **Transfer Impact Analysis**: See how transfers affected player performance with before/after comparisons
  - Top 5 statistical achievements
- **Advanced Filtering**: Filter by position, class, conference, season, and more
- **Clickable Team Links**: Navigate seamlessly from player pages to team profiles

### 🏫 **Team Stats & Profiles**
- **Team Performance Metrics**: Explore team statistics, win percentages, conference rankings, and more
- **Team Profile Pages**: Comprehensive team analysis featuring:
  - Season-by-season performance records
  - Interactive performance charts
  - Complete roster with player links
  - Team statistics over time
- **Conference Analysis**: Filter and compare teams by conference

### 🔄 **Track Transfers**
- **Transfer Database**: Monitor player movements between schools
- **Transfer Details**: View transfer rankings, seasons, and team transitions
- **Transfer Impact**: Analyze how transfers impact player performance (featured on player profiles)

### ⚖️ **Compare Tool**
- **Side-by-Side Comparison**: Compare up to 5 players or teams simultaneously
- **Multi-Stat Analysis**: Compare multiple statistics across selected entities
- **Visual Comparisons**: Line charts and bar charts for easy visual comparison
- **Flexible Selection**: Choose from 1-5 entities to compare

### 🔍 **Powerful Search & Filtering**
- **Smart Search**: Autocomplete suggestions as you type across searchable columns
- **Advanced Filters**: 
  - **String Filters**: Text-based "contains" filtering
  - **Number Filters**: Min/Max range inputs for numeric data
  - **Categorical Filters**: Multi-select checkboxes for categories
  - **Date Filters**: From/To date pickers for temporal data
- **Persistent State**: All filters, searches, and selections persist across page navigation

### 📋 **Flexible Data Tables**
- **Customizable Columns**: Show/hide columns dynamically with "Manage Columns"
- **Column Reordering**: Drag and drop to reorder columns to your preference
- **Sortable Columns**: Click column headers to sort ascending/descending
- **Pagination**: Navigate through large datasets efficiently (25-10,000 rows per page)
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### 📥 **Data Export**
- **Multiple Formats**: Export filtered data as CSV or XLSX
- **Filtered Exports**: Only export the data you're currently viewing
- **One-Click Download**: Quick access via the header download button

### 🎨 **User Experience**
- **IU Branding**: Beautiful Indiana University crimson and cream color scheme
- **Responsive Design**: Fully functional on all device sizes
- **Persistent State**: Your filters, column selections, and pagination settings are saved
- **Fast Performance**: Optimized data loading and rendering
- **Intuitive Navigation**: Clean sidebar navigation with clear page labels

---

## 🚀 Getting Started from GitHub

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/downloads)

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ncaa-basketball-data-explorer.git

# Navigate to the project directory
cd ncaa-basketball-data-explorer
```

### Step 2: Install Dependencies

```bash
# Install all required packages
npm install
```

This will install all the project dependencies including React, TypeScript, Vite, Tailwind CSS, and other required packages.

### Step 3: Add Your Data File

1. **Create the data directory** (if it doesn't exist):
   ```bash
   mkdir -p public/data
   ```

2. **Add your Excel file**:
   - Place your Excel file named `NCAA Mens basketball Data (2).xlsx` in the `public/data/` directory
   - The file should contain three sheets:
     - **Teams** - Team statistics and information
     - **Players** - Player statistics and information
     - **Transfers** - Transfer records
   
   > **Note**: If your sheet names differ, the app will attempt to match them automatically. The Excel file is excluded from git (see `.gitignore`), so each user needs to add their own data file.

### Step 4: Run the Development Server

```bash
npm run dev
```

The application will start and you'll see output like:
```
  VITE v7.2.2  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 5: Open in Browser

Navigate to `http://localhost:5173` (or the port shown in your terminal) to view the application.

---

## 📖 Usage Guide

### Navigation

- **Dashboard**: Overview of all data with top 10 rankings and summary statistics
- **Player Stats**: Browse and search through player data
- **Team Stats**: Explore team statistics and performance
- **Track Transfers**: View player transfer records
- **Compare**: Compare up to 5 players or teams side-by-side

### Using the Data Explorer

1. **Search**: Type in the search bar to find records across searchable columns
2. **Filter**: Use the "Filters & Columns" panel to:
   - Apply filters to specific columns
   - Show/hide columns using the "Manage Columns" tab
   - Reorder columns by dragging
3. **Sort**: Click column headers to sort data
4. **Navigate**: Use pagination controls at the bottom to browse through pages
5. **Export**: Click the "Download" button in the header to export filtered data

### Player/Team Profiles

- Click on any player name or team name to view their detailed profile
- Explore season-by-season statistics
- View interactive charts tracking performance over time
- For players: See transfer history and transfer impact analysis

### Compare Feature

1. Navigate to the "Compare" page
2. Search and select 1-5 players or teams
3. Choose a statistic to compare
4. View side-by-side comparisons with charts and tables

---

## 🛠️ Build for Production

To create a production build:

```bash
npm run build
```

The optimized files will be generated in the `dist/` directory. You can preview the production build with:

```bash
npm run preview
```

---

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── ComparePage.tsx  # Player/Team comparison tool
│   ├── DataExplorer.tsx # Main data exploration interface
│   ├── DataTable.tsx    # Data table with pagination & sorting
│   ├── FiltersPanel.tsx # Column selection and filtering UI
│   ├── Header.tsx       # Top navigation bar
│   ├── Home.tsx         # Dashboard with top 10 rankings
│   ├── PlayerProfilePage.tsx  # Individual player profile
│   ├── TeamPage.tsx     # Individual team profile
│   ├── SearchBar.tsx    # Search with autocomplete
│   └── SidebarLayout.tsx # Main layout with navigation
├── config/
│   └── columns.ts       # Column definitions and configurations
├── context/
│   ├── DataContext.tsx  # Global data state management
│   └── AppStateContext.tsx # Persistent UI state (filters, selections)
└── utils/
    ├── download.ts      # CSV/XLSX export utilities
    ├── filters.ts       # Filtering logic
    ├── loadData.ts      # Excel file loading and parsing
    ├── playerUtils.ts   # Player-related utilities
    └── teamUtils.ts     # Team-related utilities

public/
└── data/
    └── NCAA Mens basketball Data (2).xlsx  # Your Excel file goes here
```

---

## 🎨 Customization

### Column Configuration

Edit `src/config/columns.ts` to customize:
- Column labels and display names
- Column types (string, number, date, categorical)
- Which columns are searchable
- Which columns are filterable
- Default visible columns

### Theming

The app uses Tailwind CSS with IU colors defined in `tailwind.config.js`:
- **Primary (Crimson)**: `#990000`
- **Background (Cream)**: `#EDEBEB`
- **Text**: `#191919`

Modify `tailwind.config.js` to customize the color scheme.

---

## 🧪 Technologies

- **[React 19](https://react.dev/)** - Modern UI framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Vite](https://vitejs.dev/)** - Lightning-fast build tool and dev server
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[React Router](https://reactrouter.com/)** - Client-side routing
- **[Recharts](https://recharts.org/)** - Composable charting library
- **[SheetJS (xlsx)](https://sheetjs.com/)** - Excel file parsing and generation

---

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

---

## 🤝 Contributing

This project is developed by the Sports Innovation Institute at Indiana University. For contributions or questions, please contact the development team.

---

## 📄 License

MIT License - feel free to use this project for your own purposes.

---

## 🙏 Acknowledgments

- **Sports Innovation Institute, Indiana University** - Data and project support
- Built with modern web technologies for optimal performance and user experience

---

## 📧 Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.

---

**Made with ❤️ by the Sports Innovation Institute at Indiana University**
