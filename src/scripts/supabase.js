
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://uukmbmeeomaylqaznqwy.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1a21ibWVlb21heWxxYXpucXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTE2MTA2MzksImV4cCI6MjAyNzE4NjYzOX0.aJEI3BgQtqDPf6XJm0pFrj0KsYG3LV3Ngx_paOzvJjo')


async function fetchDataFromSupabase() {
    try {
        const { data, error } = await supabase.from('filez').select('*')
        console.log(data);
        if (error) {
            console.error('Error fetching data:', error.message)
            return
        }
        console.log('Fetched data:', data)
    } catch (error) {
        console.error('Error fetching data:', error.message)
    }
}


async function insertDataIntoCollection(mydata) {
    try {
        const dataToInsert = mydata
        const { data, error } = await supabase.from('filez').insert(dataToInsert)
        if (error) {
            console.error('Error inserting data:', error.message)
            return
        }
        console.log('Inserted data:', data)
    } catch (error) {
        console.error('Error inserting data:', error.message)
    }
}

export { insertDataIntoCollection, fetchDataFromSupabase }

