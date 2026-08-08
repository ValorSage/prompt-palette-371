# AI Canvas Studio

Build and deploy a complete production-ready AI image generation SaaS in this Lovable project.



Use Lovable Cloud for Auth, Database, Storage, Server/Edge Functions and Secrets, and Lovable AI only for optional helper features. Use the real OpenAI GPT Image 2 API server-side for image generation/editing. Never expose API keys in the frontend.



DESIGN:

Create a premium modern dark-first UI inspired by professional AI creative tools: responsive, clean, minimal, rounded cards, subtle borders, smooth animations, excellent loading/error/empty states and mobile support.



AUTH:

Google Sign-In/Sign-Out with protected private user data.



APP LAYOUT:

Left sidebar:

- New Project

- Projects

- Gallery

- References

- Favorites

- Settings

- Usage

- Profile



Main workspace:

- Project/conversation header

- Chat-style generation history

- Generated image cards

- Image preview/details

- Bottom generation composer



GENERATION COMPOSER:

Large prompt field with:

- + Add Image

- References

- Previous Image

- Model selector

- Settings

- Generate button



Uploaded images appear as thumbnails with X remove buttons.



MODEL:

Default: GPT Image 2 (`gpt-image-2`).



Use only parameters actually supported by the current OpenAI API, including supported quality, size, output options and image-generation/editing capabilities. Do not invent unsupported controls.



OPENAI:

Create secure backend/Edge Functions:

User → Backend → OpenAI GPT Image 2 → Storage → Database → UI.



Use `OPENAI_API_KEY` as a secure Cloud Secret.

Never expose it client-side.



Support:

- Generate

- Edit

- Regenerate

- Variations

- Image-to-image/reference workflows

- Multiple outputs when supported

- Generation status: queued/processing/completed/failed

- Retry

- Error handling

- Rate limiting

- Duplicate-request protection



PROJECTS:

Users can create, rename and delete projects. Each project contains conversations, generations and references.



REFERENCES:

Create a reusable Reference Library.



Users can create collections such as:

- Brand Style

- Product Style

- Character

- Fashion

- Architecture



Each collection supports up to 50 stored images by default.



Allow:

- Upload

- Delete

- Rename

- Search

- Select individual images

- Select collection

- Use references during generation



Important:

50 images are stored in the user's library, but do NOT send more images than the actual GPT Image 2 API input limit in one request.



Implement a Reference Analyzer that creates a cached visual profile from the collection:

style, colors, lighting, composition, camera, materials, textures, subjects, mood and design language.



When generating:

Prompt + Reference Profile + best/relevant supported reference images → GPT Image 2.



References are contextual inputs, NOT model training or fine-tuning.



Show the user which references were selected.



GALLERY:

Create a professional image gallery with:

- Grid/masonry

- Search

- Filters

- Sort

- Favorites

- Download

- Delete

- Rename

- Duplicate

- Add to References

- Open/Edit/Regenerate



IMAGE DETAILS:

Show:

- Large preview

- Prompt

- Model

- Settings

- References used

- Project

- Date

- Version history



Support non-destructive image versions:

Original → Version 1 → Version 2 → etc.



SETTINGS:

Create a complete Settings page:



Account:

- Name

- Email

- Avatar

- Google account



Generation:

- Default model

- Quality

- Size

- Output settings

- Number of images where supported



References:

- Reference limit

- Automatic analysis

- Automatic relevant-reference selection



Interface:

- Dark/Light/System

- Language

- Gallery layout

- Sidebar behavior



Usage:

- Generations

- Reference analysis

- Estimated usage

- Activity



Privacy:

- Delete account

- Delete projects

- Delete images

- Data export



DATABASE:

Use PostgreSQL/Lovable Cloud with proper relationships for:

profiles, projects, conversations, messages, generations, generated_images, reference_collections, reference_images, reference_profiles, generation_references, image_versions, user_settings and usage_events.



STORAGE:

Use private Cloud Storage for:

avatars, references and generated images.

Use secure/signed access. Store metadata in the database, not image binaries.



SECURITY:

Implement Row Level Security and server-side ownership checks.

Users must never access another user's projects, images, references or conversations.

Validate files, parameters and permissions on the server.

Never trust frontend authorization.



PERFORMANCE:

Use thumbnails, lazy loading, pagination/infinite loading, caching, database indexes and optimized image loading. Do not load all reference originals at once.



UX:

Add:

- Toasts

- Skeleton loaders

- Progress states

- Empty states

- Error states

- Confirmation dialogs

- Keyboard accessibility

- Responsive desktop/tablet/mobile layouts



LANDING PAGE:

Create a polished landing page explaining:

AI image generation, editing, references, projects and creative workflow.

Do not use fake testimonials or fake claims.



ROUTES:

Create:

/

 /login

 /dashboard

 /projects

 /projects/:id

 /gallery

 /references

 /references/:id

 /settings

 /settings/account

 /settings/generation

 /settings/references

 /settings/usage



IMPORTANT:

Do not build a mock/demo.

Do not use fake generated images.

Do not leave core TODOs.

Implement the real database, authentication, storage, backend functions, RLS, references and OpenAI integration.



Use the official OpenAI API documentation as the source of truth for GPT Image 2 capabilities and limits. If a requested UI option is unsupported, do not implement it as a fake feature.



After implementation, test authentication, database persistence, storage, RLS, references, generation, editing, gallery, settings, mobile responsiveness, API errors and security. Fix implementation errors and deploy the complete application.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://prompt-palette-371.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f0f429e4-93f1-4eda-afc8-80de55f46ab2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
