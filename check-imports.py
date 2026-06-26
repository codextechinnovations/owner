import os, re, json

# Common MUI components and icons that are often missed (add more as needed)
MUI_COMPONENTS = {
    'Box','Card','CardContent','Typography','Button','TextField','Grid','Avatar','Chip','IconButton',
    'Dialog','DialogTitle','DialogContent','DialogActions','DialogContentText','FormControl','InputLabel',
    'Select','MenuItem','Skeleton','Alert','Divider','Paper','InputAdornment','List','ListItem','ListItemText',
    'ListItemButton','ListItemIcon','LinearProgress','CircularProgress','Badge','Menu','Drawer','AppBar',
    'Toolbar','Tabs','Tab','Tooltip','Fab','Switch','Checkbox','Radio','RadioGroup','FormControlLabel',
    'FormGroup','Autocomplete','Pagination','Table','TableBody','TableCell','TableContainer','TableHead',
    'TableRow','Stepper','Step','StepLabel','StepContent','Accordion','AccordionSummary','AccordionDetails',
    'Rating','Slider','Container','Link','OutlinedInput','FormHelperText','Collapse','SpeedDial','SpeedDialAction',
    'SpeedDialIcon','ToggleButton','ToggleButtonGroup','Stack','Breadcrumbs','Snackbar','Backdrop','Modal',
    'Fade','Grow','Zoom','Slide','ClickAwayListener','Popover','Hidden'
}

# Read all icons from @mui/icons-material? Too many. We'll detect capitalized tags that are not imported and not common components/HTML.
# Instead, we identify all JSX tags (capitalized), subtract imported names, local components, and HTML tags.
# Then report any remaining capitalized tag that is used.

def find_issues(root):
    issues = []
    for dirpath, _, files in os.walk(root):
        if 'node_modules' in dirpath:
            continue
        for f in files:
            if not f.endswith(('.js','.jsx','.ts','.tsx')):
                continue
            path = os.path.join(dirpath, f)
            try:
                text = open(path, 'r', encoding='utf-8').read()
            except Exception:
                continue
            # Find default/named imports
            imported = set()
            # import { ... } from '@mui/material' or '@mui/icons-material' etc.
            for m in re.finditer(r"import\s+\{([^}]+)\}\s+from\s+['\"]([^'\"]+)['\"]", text):
                names = [n.strip().split(' as ')[0].strip() for n in m.group(1).split(',')]
                imported.update(names)
            # import Something from '...'
            for m in re.finditer(r"import\s+(\w+)\s+from\s+['\"][^'\"]+['\"]", text):
                imported.add(m.group(1))
            # import * as Something
            for m in re.finditer(r"import\s+\*\s+as\s+(\w+)\s+from", text):
                imported.add(m.group(1))

            # Find JSX tags
            tags = set(re.findall(r"<([A-Z][a-zA-Z0-9_]*)", text))
            # Also self-closing / components with dot notation like <X.Y> not needed here
            # Remove imported
            undefined = tags - imported
            # Remove common HTML-like React components (Suspense, Fragment, etc)
            undefined -= {'React','Suspense','Fragment','StrictMode','Profiler','Component','Navigate','Route','Routes','Router','BrowserRouter','Link','NavLink','Outlet','ThemeProvider','CssBaseline','AuthProvider','AuthContext','ErrorBoundary','useNavigate','useLocation','useTheme','useMediaQuery','useAuth','useState','useEffect','useCallback','useMemo','useRef','useContext','useReducer','useLayoutEffect','useId'}
            # Remove local function components? Hard. Instead remove lowercase HTML-like and known hooks.
            # If undefined still has common MUI components/icons, report.
            report = []
            for u in undefined:
                # Likely MUI if in MUI_COMPONENTS
                if u in MUI_COMPONENTS:
                    report.append(u)
            if report:
                issues.append((path, sorted(report)))
    return issues

if __name__ == '__main__':
    root = os.path.join(os.path.dirname(__file__), 'src')
    issues = find_issues(root)
    if issues:
        print('POSSIBLE MISSING IMPORTS:')
        for path, names in issues:
            print(f"{path}: {', '.join(names)}")
    else:
        print('No obvious missing MUI imports found.')
