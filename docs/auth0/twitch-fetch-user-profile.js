/* Pegar esta funcion en Fetch User Profile de la conexion social personalizada "twitch". */
function fetchUserProfile(accessToken, context, callback) {
  request.get(
    {
      url: "https://id.twitch.tv/oauth2/userinfo",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    (error, response, body) => {
      if (error) return callback(error);
      if (response.statusCode !== 200) return callback(new Error(body));

      let user;
      try {
        user = JSON.parse(body);
      } catch (parseError) {
        return callback(parseError);
      }

      return callback(null, {
        user_id: user.sub,
        username: user.preferred_username,
        name: user.preferred_username,
        email: user.email,
        email_verified: user.email_verified === true,
        picture: user.picture,
      });
    },
  );
}
