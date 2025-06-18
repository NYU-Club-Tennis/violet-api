import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    // 1. Get configuration values from environment variables
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientID) {
      throw new Error('Missing GOOGLE_CLIENT_ID environment variable');
    }

    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    if (!clientSecret) {
      throw new Error('Missing GOOGLE_CLIENT_SECRET environment variable');
    }

    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');
    if (!callbackURL) {
      throw new Error('Missing GOOGLE_CALLBACK_URL environment variable');
    }

    // 2. Configure the Google OAuth strategy
    super({
      clientID, // Your Google OAuth client ID
      clientSecret, // Your Google OAuth client secret
      callbackURL, // Where Google redirects after authentication
      scope: ['email', 'profile'], // What information we want from Google
    });
  }

  // 3. This method is called after Google authentication succeeds
  async validate(
    accessToken: string, // Token to access Google APIs
    refreshToken: string, // Token to get new access tokens
    profile: Profile, // User's Google profile
    done: VerifyCallback, // Callback to tell Passport if auth succeeded
  ): Promise<any> {
    // 4. Extract user information from Google profile
    const { name, emails, photos } = profile;

    // 5. Check if email exists
    if (!emails || emails.length === 0) {
      return done(new Error('No email found from Google profile'), false);
    }

    const email = emails[0].value;

    // 6. Check if email is from NYU
    // if (!email.endsWith('@nyu.edu')) {
    //   return done(new Error('Only NYU email addresses are allowed'), false);
    // }

    // 7. Prepare user data from Google profile
    const userData = {
      email: email,
      name: name?.givenName + ' ' + name?.familyName || profile.displayName,
      picture: photos && photos.length > 0 ? photos[0].value : null,
      googleId: profile.id,
    };

    try {
      // 8. Find or create user in your database
      const savedUser = await this.authService.validateUser(userData);
      // 9. Tell Passport authentication succeeded
      return done(null, savedUser);
    } catch (error) {
      // 10. Tell Passport authentication failed
      return done(error, false);
    }
  }
}

/**
 * This strategy is responsible for:
  Validating the Google authentication
  Ensuring only NYU emails are allowed
  Managing user data in your database
  Telling Passport if authentication succeeded
 */
