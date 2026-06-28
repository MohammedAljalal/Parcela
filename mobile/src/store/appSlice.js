import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

const LANGUAGE_KEY = 'parcela_language';

// ─── Thunk: Bootstrap App (restore persisted language on launch) ──────────────
export const bootstrapApp = createAsyncThunk(
  'app/bootstrapApp',
  async (_, { rejectWithValue }) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      const lang = savedLanguage ?? 'pt';
      console.log('[App] Restored language:', lang);
      await i18n.changeLanguage(lang);
      return lang;
    } catch (error) {
      console.error('[App] Failed to restore language:', error);
      return rejectWithValue('pt');
    }
  }
);

// ─── Thunk: Set Language (update Redux + persist to storage) ──────────────────
export const setLanguagePersisted = createAsyncThunk(
  'app/setLanguagePersisted',
  async (languageCode, { rejectWithValue }) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
      await i18n.changeLanguage(languageCode);
      console.log('[App] Language saved:', languageCode);
      return languageCode;
    } catch (error) {
      console.error('[App] Failed to save language:', error);
      return rejectWithValue(languageCode); // Still update UI even if persist fails
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState = {
  language: 'pt', // 'pt' | 'en'
  isAppInitialized: false,
};

// ─── Slice ────────────────────────────────────────────────────────────────────
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // Synchronous setter (kept for backward compat, but prefer setLanguagePersisted)
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
  },
  extraReducers: (builder) => {
    // bootstrapApp
    builder.addCase(bootstrapApp.fulfilled, (state, action) => {
      state.language = action.payload;
      state.isAppInitialized = true;
    });
    builder.addCase(bootstrapApp.rejected, (state) => {
      state.language = 'pt';
      state.isAppInitialized = true;
    });

    // setLanguagePersisted
    builder.addCase(setLanguagePersisted.fulfilled, (state, action) => {
      state.language = action.payload;
    });
    builder.addCase(setLanguagePersisted.rejected, (state, action) => {
      // Still update the UI language even if persistence failed
      if (action.payload) {
        state.language = action.payload;
      }
    });
  },
});

export const { setLanguage } = appSlice.actions;
export default appSlice.reducer;
