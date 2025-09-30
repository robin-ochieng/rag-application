#!/bin/bash

echo "Setting up Supabase database schema..."

# You can run this schema in your Supabase Dashboard > SQL Editor
echo "Please copy and run the SQL from supabase-schema.sql in your Supabase Dashboard > SQL Editor"
echo "Or you can run it directly using the Supabase CLI if you have it installed:"
echo "supabase db push"

echo ""
echo "Database schema setup complete!"
echo ""
echo "The schema includes:"
echo "- profiles table with auto-creation trigger"
echo "- chats table for storing conversations"
echo "- messages table for storing individual messages"
echo "- Row Level Security (RLS) policies for data protection"
echo "- Indexes for performance optimization"