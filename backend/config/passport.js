const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User, Role } = require('../models');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find or create user
        let user = await User.findOne({
          where: { providerId: profile.id, provider: 'google' },
        });

        if (!user) {
          // Check if email already exists (local user)
          user = await User.findOne({
            where: { email: profile.emails[0].value },
          });

          if (user) {
            // Link Google to existing account
            user.provider = 'google';
            user.providerId = profile.id;
            await user.save();
          } else {
            // Create new user
            user = await User.create({
              email: profile.emails[0].value,
              firstName: profile.name.givenName,
              lastName: profile.name.familyName,
              provider: 'google',
              providerId: profile.id,
            });

            // Assign default role
            const defaultRole = await Role.findOne({ where: { name: 'user' } });
            if (defaultRole) {
              await user.addRole(defaultRole);
            }
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
