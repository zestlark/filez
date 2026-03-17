import { supabase } from './supabase'
import type { FileNode } from '../types'

/**
 * DATABASE OPERATIONS (Mapped to Supabase 'config' table)
 */

async function getdatabasedata(path: string) {
    try {
        // Normalize path: remove leading slash if present
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        
        const { data, error } = await supabase
            .from('config')
            .select('contents')
            .eq('id', cleanPath)
            .single()

        if (error) {
            if (error.code === 'PGRST116') { // Record not found

                return [];
            }
            throw error;
        }
        return data.contents || [];
    } catch (error) {

        return [];
    }
}

async function insertdatabasedata(path: string, newData: FileNode[]) {
    try {
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        
        const { error } = await supabase
            .from('config')
            .upsert({ id: cleanPath, contents: newData })

        if (error) throw error;
    } catch (error) {
        throw error;
    }
}

/**
 * FILE CONTENT FETCHING
 */

async function fetchFileContent(url: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch file content");
        return await response.text();
    } catch (error) {

        return 'Could not load file content...';
    }
}

/**
 * STORAGE OPERATIONS (Supabase Storage 'filez' bucket)
 */

async function deleteFileByUrl(fileUrl: string) {
    try {
        // Supabase storage URLs usually contain the path after /storage/v1/object/public/filez/
        const bucketName = 'filez';
        const urlParts = fileUrl.split(`${bucketName}/`);
        if (urlParts.length < 2) throw new Error("Could not parse file path from URL");
        
        const filePath = decodeURIComponent(urlParts[1]);
        const { error } = await supabase.storage
            .from(bucketName)
            .remove([filePath]);

        if (error) throw error;
    } catch (error) {
        // error handled silently
    }
}

export { 
    getdatabasedata, 
    insertdatabasedata, 
    fetchFileContent, 
    deleteFileByUrl,
    supabase 
};