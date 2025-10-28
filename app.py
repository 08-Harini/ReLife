import streamlit as st
import pandas as pd
from difflib import get_close_matches

# Page setup
st.set_page_config(page_title="ReLife", page_icon="♻️")
st.title("♻️ ReLife - Giving Waste a Second Life!")

# Load CSV safely
try:
    df = pd.read_csv("items.csv", encoding="utf-8-sig")
    # Clean column names
    df.columns = df.columns.str.strip().str.lower()
except FileNotFoundError:
    st.error("❌ CSV file not found. Make sure 'items.csv' is in the same folder as this script.")
    st.stop()

# Check for correct columns
required_cols = {"item", "category", "suggestion"}
if not required_cols.issubset(set(df.columns)):
    st.error(f"❌ Your CSV must contain columns named exactly: {', '.join(required_cols)}")
    st.write("Detected columns:", df.columns.tolist())
    st.stop()

# User input
user_input = st.text_input("🔍 Enter an item name to check disposal suggestions:")

if user_input:
    # Case-insensitive match
    matches = df[df["item"].str.lower() == user_input.lower()]

    if not matches.empty:
        category = matches.iloc[0]["category"]
        suggestion = matches.iloc[0]["suggestion"]

        st.success(f"**Category:** {category}")
        st.markdown(suggestion, unsafe_allow_html=True)

    else:
        # Closest match if no exact found
        all_items = df["item"].str.lower().tolist()
        close_match = get_close_matches(user_input.lower(), all_items, n=1, cutoff=0.6)

        if close_match:
            matched_row = df[df["item"].str.lower() == close_match[0]].iloc[0]
            st.warning(f"No exact match found. Showing result for **{matched_row['item']}** instead.")
            st.success(f"**Category:** {matched_row['category']}")
            st.markdown(matched_row["suggestion"], unsafe_allow_html=True)
        else:
            st.error("❌ No matching or similar items found. Try another one.")
