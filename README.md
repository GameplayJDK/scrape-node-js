# scrape-node-js

Temporary web scraper for customer webpage migrations.

## Installation

Create a `configuration.json` file and edit it so it suits your needs.

You can find an example configuration in `example_configuration.json`.

```bash
# Install required dependencies
npm install

# Run the application using a custom run script.
./run.sh
```

## Usage

The tool can be configured using the values inside `configuration.json`. The available options are documented below:

| Option        | Type      | Value                                                             | Example                   |
| ------------- | --------- | ----------------------------------------------------------------- | ------------------------- |
| `main`        | `string`  | The url to the main url to scrape.                                | `http://www.example.com/` |
| `limit`       | `number`  | The limit of links to follow.                                     | `-1`                      |
| `file`        | `string`  | The path of the file to export the found links (in json format).  | `scrape-result.json`      |

_Please note, that the script does not scrape external links!_

## License

It's MIT.
