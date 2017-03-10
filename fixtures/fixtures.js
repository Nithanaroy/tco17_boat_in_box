let shipsStore = can.fixture.store([]);
can.fixture("/api/ship", shipsStore);
can.fixture.delay = 300;