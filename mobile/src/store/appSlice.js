import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  language: 'pt', // 'pt' | 'en'
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
  },
});

export const { setLanguage } = appSlice.actions;
export default appSlice.reducer;
