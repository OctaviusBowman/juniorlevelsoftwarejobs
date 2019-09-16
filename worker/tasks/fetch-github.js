const fetch = require("node-fetch");
var redis = require("redis"),
  client = redis.createClient();

const { promisify } = require("util");
const setAsync = promisify(client.set).bind(client);

const baseURL = `https://jobs.github.com/positions.json`;

module.exports = fetchGithub = async () => {
  let resultCount = 1;
  let onPage = 1;
  const allJobs = [];

  while (resultCount > 0) {
    // Each page is in an array with 50 objects
    const res = await fetch(`${baseURL}?page=${onPage}`).then(res =>
      res.json()
    );
    allJobs.push(...res);
    resultCount = res.length;
    console.log(`got ${res.length} jobs`);
    onPage++;
  }

  console.log(`Got ${allJobs.length} total`);

  // Filter
  const jrJobs = allJobs.filter(job => {
    const jobTitle = job.title.toLowerCase();

    if (
      jobTitle.includes("senior") ||
      jobTitle.includes("manager") ||
      jobTitle.includes("sr.") ||
      jobTitle.includes("architect")
    ) {
      return false;
    } else {
      return true;
    }
  });

  console.log("filtered down to", jrJobs.length);

  // Set data in redis
  const success = await setAsync("github", JSON.stringify(jrJobs));

  console.log({ success });
};

module.exports();
