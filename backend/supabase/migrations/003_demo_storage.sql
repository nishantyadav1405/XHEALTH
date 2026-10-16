-- Allow plain-text synthetic demo source documents in the private bucket.
update storage.buckets set allowed_mime_types=array['application/pdf','image/png','image/jpeg','image/webp','text/plain'] where id='medical-documents' and public=false;
