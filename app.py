import streamlit as st
import pandas as pd
import requests
from difflib import get_close_matches

# 🌿 Page setup
st.set_page_config(page_title="ReLife", page_icon="♻️")
st.title("♻️ ReLife - Giving Waste a Second Life!")

# 🌍 Fetch data from backend
try:
    # ⚠️ If both are on different laptops:
    # Replace 'localhost' with your IPv4 address (e.g., "192.168.1.7")
    response = requests.get("http://localhost:5000/uploadeditems")

    if response.status_code == 200:
        df = pd.DataFrame(response.json())  # Convert JSON to DataFrame
        df.columns = df.columns.str.strip().str.lower()
    else:
        st.error("⚠️ Could not fetch data from backend. Check if backend is running.")
        st.stop()

except requests.exceptions.ConnectionError:
    st.error("❌ Could not connect to backend. Make sure backend is running on port 5000.")
    st.stop()

# ✅ Check for required columns
required_cols = {"item", "category", "suggestion"}
if not required_cols.issubset(set(df.columns)):
    st.error(f"❌ Your backend data must have columns: {', '.join(required_cols)}")
    st.write("Detected columns:", df.columns.tolist())
    st.stop()

# 🔍 User input
user_input = st.text_input("Enter an item name to check how to recycle or dispose it:")

if user_input:
    # Case-insensitive match
    matches = df[df["item"].str.lower() == user_input.lower()]

    if not matches.empty:
        category = matches.iloc[0]["category"]
        suggestion = matches.iloc[0]["suggestion"]

        st.success(f"*Category:* {category}")
        st.markdown(suggestion, unsafe_allow_html=True)

    else:
        # Find closest match
        all_items = df["item"].str.lower().tolist()
        close_match = get_close_matches(user_input.lower(), all_items, n=1, cutoff=0.6)

        if close_match:
            matched_row = df[df["item"].str.lower() == close_match[0]].iloc[0]
            st.warning(f"No exact match found. Showing result for *{matched_row['item']}* instead.")
            st.success(f"*Category:* {matched_row['category']}")
            st.markdown(matched_row["suggestion"], unsafe_allow_html=True)
        else:
            st.error("❌ No matching or similar items found. Try another one.")
