import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// This defines which pages require the user to be logged in.
// We are protecting the /dashboard page and any page inside it.
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html|css|js|gif|svg|jpg|jpeg|png|webp|vector|ico|xls|xlsx|csv|txt|woff|woff2|ttf|eot)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};