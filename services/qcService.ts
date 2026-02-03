
import { supabase } from './supabase';
import { uploadBase64Image } from './storage';
import { ProcessResult } from '../types';

const DEFAULT_FACTORY_ID = import.meta.env.VITE_FACTORY_ID || '00000000-0000-0000-0000-000000000000';
const FACTORY_NAME = import.meta.env.VITE_FACTORY_NAME || 'FACTORY';

export const saveQCReportToDB = async (
  result: ProcessResult, 
  manualGarmentType: string, 
  factoryId: string = DEFAULT_FACTORY_ID
) => {
  try {
    console.log("Starting QC Report Save Process...");

    const measurementRecord = {
      factory_id: factoryId,
      client_ref_id: result.garment_id || 'UNKNOWN', 
      garment_batch_id: result.id || null, 
      garment_type: result.garment_type || manualGarmentType,
      detected_size: result.detected_size,
      confidence: result.confidence,
      pixels_per_cm: result.pixels_per_cm || 0,
      qc_status: result.qc_status,
      measurement_data: result.data, 
    };

    const { data: savedMeasurement, error: dbError } = await supabase
      .from('measurements')
      .insert(measurementRecord)
      .select()
      .single();

    if (dbError) {
        throw new Error(`Supabase Insert Failed: ${dbError.message}`);
    }

    const measurementId = savedMeasurement.id;
    console.log("Measurement Record Saved:", measurementId);

    const uploadedImages: { type: string, url: string }[] = [];
    const uploadPromises: Promise<any>[] = [];

    const queueUpload = (base64Data: string | undefined, type: string) => {
        if (!base64Data) return;
        
        // [FACTORY_NAME]_[MEASUREMENT_ID]_[TYPE].png
        const safeFactoryName = FACTORY_NAME.replace(/[^a-z0-9]/gi, '_');
        const fileName = `${safeFactoryName}_${measurementId}_${type}.png`;
        
        // Path Structure: garment/[FACTORY_NAME]/[FILENAME]
        const storagePath = `garment/${safeFactoryName}/${fileName}`;
        
        const p = uploadBase64Image(base64Data, storagePath)
            .then(url => {
                uploadedImages.push({ type, url });
            })
            .catch(err => {
                console.error(`Failed to upload ${type} image:`, err);
            });
        uploadPromises.push(p);
    };

    if (result.measure_image) {
        console.log("Queueing MEASURE image upload...");
        queueUpload(result.measure_image, 'MEASURE');
    } else {
        console.warn("No MEASURE image found in result.");
    }

    if (result.detect_image) {
        console.log("Queueing DETECT image upload...");
        queueUpload(result.detect_image, 'DETECT'); 
    } else {
        console.warn("No DETECT image found in result.");
    } 
    
    await Promise.all(uploadPromises);

    if (uploadedImages.length > 0) {
        const imageRecords = uploadedImages.map(img => ({
            measurement_id: measurementId,
            image_type: img.type,
            storage_url: img.url
        }));

        const { error: imgError } = await supabase
            .from('measurement_images')
            .insert(imageRecords);

        if (imgError) {
            console.error("Failed to link images to measurement:", imgError);
        }
    }

    return { success: true, id: measurementId, report: savedMeasurement };

  } catch (error: any) {
    console.error("saveQCReportToDB Error:", error);
    throw error;
  }
};

export const getQCReports = async () => {
  try {
    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .order('measured_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return data.map(row => ({
      id: row.id,
      timestamp: row.measured_at,
      garment_type: row.garment_type || 'Unknown',
      detected_size: row.detected_size || '-',
      qc_status: row.qc_status || 'UNKNOWN'
    }));
  } catch (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
};

export const uploadGarmentStandards = async (garmentType: string, standards: any[]) => {
  try {
    const { data, error } = await supabase
      .from('garment_standards')
      .upsert(
        { 
            garment_type: garmentType, 
            standards: standards,
            updated_at: new Date().toISOString()
        }, 
        { onConflict: 'garment_type' }
      )
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error uploading standards:", error);
    throw error;
  }
};
