import unittest,tempfile,sqlite3,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from backup import backup
class BackupTest(unittest.TestCase):
 def test_backup_and_restore_read(self):
  with tempfile.TemporaryDirectory() as d:
   source=Path(d)/'source.db';dest=Path(d)/'copy.db'
   with sqlite3.connect(source) as c:c.execute('CREATE TABLE example(x)');c.execute('INSERT INTO example VALUES(42)')
   backup(source,dest)
   with sqlite3.connect(dest) as c:self.assertEqual(c.execute('SELECT x FROM example').fetchone()[0],42)
   with self.assertRaises(ValueError):backup(source,dest)
