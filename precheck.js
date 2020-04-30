const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
} = process.env;

if (AWS_ACCESS_KEY_ID === undefined || AWS_SECRET_ACCESS_KEY === undefined) {
  console.log(
    `please define the envoirment variables ${`AWS_ACCESS_KEY_ID`.red} and ${
      `AWS_SECRET_ACCESS_KEY`.red
    } `
  );
  process.exit(1);
}
