/* Pegar esta funcion en Fetch User Profile de la conexion social personalizada "discord". */
function fetchUserProfile(accessToken, context, callback) {
  request.get(
    {
      url: "https://discord.com/api/v10/users/@me",
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

      const picture = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : null;
      return callback(null, {
        user_id: user.id,
        username: user.username,
        name: user.global_name || user.username,
        email: user.email,
        email_verified: user.verified === true,
        picture,
      });
    },
  );
}
