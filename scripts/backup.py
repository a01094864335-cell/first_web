"""Create an SQLite-consistent backup. Destination must be a new local file.

Usage: python scripts/backup.py /secure/path/cafe-YYYYMMDD.sqlite3
Store outside public directories. No automatic retention/deletion policy assumed.
"""
import argparse, sqlite3, sys, os
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import server

def backup(source,destination):
 source=Path(source).resolve();destination=Path(destination).resolve()
 if not source.is_file():raise ValueError('Source database does not exist')
 if destination.exists():raise ValueError('Destination already exists; choose a new filename')
 if destination.is_relative_to((server.ROOT/'public').resolve()):raise ValueError('Backups must not be public')
 destination.parent.mkdir(parents=True,exist_ok=True)
 # Exclusive creation protects against accidental overwrite.
 fd=os.open(destination,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600);os.close(fd)
 try:
  with sqlite3.connect(f'file:{source}?mode=ro',uri=True) as src,sqlite3.connect(destination) as dst:
   src.backup(dst)
   if dst.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise ValueError('Backup integrity check failed')
 except:
  destination.unlink(missing_ok=True);raise
 return destination
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('destination');args=parser.parse_args()
 backup(server.DB,args.destination);print('Backup created and integrity checked.')
